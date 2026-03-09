import express, { Request, Response } from 'express'
import prismaService from '../services/prisma'
import { logger } from '../middleware/security'

const router = express.Router()
const prisma = prismaService.getClient()

const SESSION_TIMEOUT_MS = parseInt(process.env.USSD_SESSION_TIMEOUT_MS ?? '300000')

type UssdMenuStep = 'welcome' | 'login' | 'main_menu' | 'courses_menu' | 'progress_menu' | 'help_menu'

interface StoredSessionPayload {
  userCode?: string
}

const parsePayload = (payload: string | null): StoredSessionPayload => {
  if (!payload) return {}
  try {
    return JSON.parse(payload) as StoredSessionPayload
  } catch {
    return {}
  }
}

const formatResponse = (shouldEnd: boolean, message: string): string => {
  const prefix = shouldEnd ? 'END' : 'CON'
  return `${prefix} ${message}`
}

async function cleanupExpiredSessions(now: Date): Promise<void> {
  await prisma.ussdSession.deleteMany({
    where: {
      expires_at: { lt: now }
    }
  })
}

async function getOrCreateSession(sessionId: string | undefined, phoneNumber: string): Promise<{
  id: string
  step: UssdMenuStep
  payload: StoredSessionPayload
}> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS)

  await cleanupExpiredSessions(now)

  if (sessionId) {
    const byId = await prisma.ussdSession.findUnique({
      where: { id: sessionId }
    })

    if (byId && byId.expires_at > now) {
      const payload = parsePayload(byId.payload)
      return {
        id: byId.id,
        step: byId.step as UssdMenuStep,
        payload
      }
    }
  }

  const generatedId = sessionId ?? `session_${phoneNumber.replace(/\D/g, '')}_${Date.now()}`
  await prisma.ussdSession.upsert({
    where: { id: generatedId },
    update: {
      phone_number: phoneNumber,
      step: 'welcome',
      payload: JSON.stringify({}),
      last_activity: now,
      expires_at: expiresAt
    },
    create: {
      id: generatedId,
      phone_number: phoneNumber,
      step: 'welcome',
      payload: JSON.stringify({}),
      last_activity: now,
      expires_at: expiresAt
    }
  })

  return {
    id: generatedId,
    step: 'welcome',
    payload: {}
  }
}

async function saveSession(session: {
  id: string
  step: UssdMenuStep
  payload: StoredSessionPayload
  phoneNumber: string
}): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_TIMEOUT_MS)

  await prisma.ussdSession.update({
    where: { id: session.id },
    data: {
      phone_number: session.phoneNumber,
      step: session.step,
      payload: JSON.stringify(session.payload),
      user_code: session.payload.userCode ?? null,
      last_activity: now,
      expires_at: expiresAt
    }
  })
}

async function resolveProgressSummary(userCode: string): Promise<{
  totalCourses: number
  completedModules: number
  averageProgress: number
}> {
  const rows = await prisma.progress.findMany({
    where: { user_code: userCode }
  })

  const totalCourses = rows.length
  const completedModules = rows.reduce((acc: number, row: any) => {
    try {
      const parsed = JSON.parse(row.completed_modules) as unknown[]
      return acc + parsed.length
    } catch {
      return acc
    }
  }, 0)

  const averageProgress = totalCourses > 0
    ? Math.round(rows.reduce((acc: number, row: any) => acc + row.percentage, 0) / totalCourses)
    : 0

  return {
    totalCourses,
    completedModules,
    averageProgress
  }
}

async function handleUssdRequest(
  phoneNumber: string,
  text: string,
  sessionId: string | undefined,
  res: Response
): Promise<void> {
  try {
    const session = await getOrCreateSession(sessionId, phoneNumber)
    const parts = text.trim() ? text.split('*').map(item => item.trim()) : []

    if (parts.length === 0 || session.step === 'welcome') {
      session.step = 'login'
      await saveSession({ ...session, phoneNumber })
      res.json({
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `WIRA - Women's Integrated Reintegration Academy\n\nBem-vinda ao WIRA.\n\nSeu código de acesso (ex: V0042):`)
      })
      return
    }

    if (session.step === 'login') {
      const inputCode = parts[parts.length - 1].toUpperCase()
      const user = await prisma.user.findUnique({
        where: { anonymous_code: inputCode },
        select: { anonymous_code: true, is_active: true }
      })

      if (!user || !user.is_active) {
        await saveSession({ ...session, phoneNumber })
        res.json({
          success: true,
          sessionId: session.id,
          response: formatResponse(false, 'Código inválido. Tente novamente com o formato V#### ou digite 4 para sair.')
        })
        return
      }

      session.step = 'main_menu'
      session.payload.userCode = user.anonymous_code
      await saveSession({ ...session, phoneNumber })
      res.json({
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `Bem-vinda, ${user.anonymous_code}!\n\n1. Meus Cursos\n2. Meu Progresso\n3. Ajuda\n4. Sair`)
      })
      return
    }

    const option = parts[parts.length - 1]
    const userCode = session.payload.userCode
    if (!userCode) {
      session.step = 'login'
      await saveSession({ ...session, phoneNumber })
      res.json({
        success: true,
        sessionId: session.id,
        response: formatResponse(false, 'Sessão sem autenticação. Informe novamente seu código V####.')
      })
      return
    }

    if (option === '4') {
      await prisma.ussdSession.delete({ where: { id: session.id } })
      res.json({
        success: true,
        sessionId: session.id,
        response: formatResponse(true, 'Obrigado por usar WIRA. Até breve.')
      })
      return
    }

    if (option === '1') {
      const progressRows = await prisma.progress.findMany({
        where: { user_code: userCode },
        include: {
          course: {
            select: { title: true, modules_count: true }
          }
        }
      })

      if (progressRows.length === 0) {
        session.step = 'courses_menu'
        await saveSession({ ...session, phoneNumber })
        res.json({
          success: true,
          sessionId: session.id,
          response: formatResponse(false, 'Você ainda não tem cursos atribuídos.\n\n0. Voltar ao menu principal')
        })
        return
      }

      const lines = progressRows
        .map((item: any, index: number) => `${index + 1}. ${item.course.title} - ${item.percentage}%`)
        .join('\n')

      session.step = 'courses_menu'
      await saveSession({ ...session, phoneNumber })
      res.json({
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `SEUS CURSOS:\n${lines}\n\n0. Voltar ao menu principal`)
      })
      return
    }

    if (option === '2') {
      const summary = await resolveProgressSummary(userCode)
      session.step = 'progress_menu'
      await saveSession({ ...session, phoneNumber })
      res.json({
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `PROGRESSO GERAL - ${userCode}\n\nCursos Ativos: ${summary.totalCourses}\nMódulos Completos: ${summary.completedModules}\nProgresso Médio: ${summary.averageProgress}%\n\n0. Voltar ao menu principal`)
      })
      return
    }

    if (option === '3') {
      session.step = 'help_menu'
      await saveSession({ ...session, phoneNumber })
      res.json({
        success: true,
        sessionId: session.id,
        response: formatResponse(false, 'AJUDA WIRA\n\nFormato do código: V####\nSuporte: +258 84 123 4567\nEmail: ajuda@wira.org\n\n0. Voltar ao menu principal')
      })
      return
    }

    if (option === '0') {
      session.step = 'main_menu'
      await saveSession({ ...session, phoneNumber })
      res.json({
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `Bem-vinda, ${userCode}!\n\n1. Meus Cursos\n2. Meu Progresso\n3. Ajuda\n4. Sair`)
      })
      return
    }

    await saveSession({ ...session, phoneNumber })
    res.json({
      success: true,
      sessionId: session.id,
      response: formatResponse(false, 'Opção inválida.\n\n1. Meus Cursos\n2. Meu Progresso\n3. Ajuda\n4. Sair')
    })
  } catch (error) {
    logger.error('USSD processing error', { error: (error as Error).message })
    res.status(500).json({
      success: false,
      error: 'Erro no processamento USSD'
    })
  }
}

router.post('/test', async (req: Request, res: Response): Promise<void> => {
  const { phoneNumber = '+258840000000', text = '', sessionId } = req.body as {
    phoneNumber?: string
    text?: string
    sessionId?: string
  }

  await handleUssdRequest(phoneNumber, text, sessionId, res)
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const { sessionId, phoneNumber = '+258840000000', text = '' } = req.body as {
    sessionId?: string
    phoneNumber?: string
    text?: string
  }

  await handleUssdRequest(phoneNumber, text, sessionId, res)
})

router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  const now = new Date()
  const activeSessions = await prisma.ussdSession.count({
    where: { expires_at: { gt: now } }
  })

  res.json({
    success: true,
    service: 'WIRA USSD Service',
    status: 'Online',
    shortcode: process.env.USSD_SHORTCODE ?? '*123#',
    sessionTimeoutMs: SESSION_TIMEOUT_MS,
    activeSessions,
    timestamp: now.toISOString()
  })
})

router.get('/sms/status', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    service: 'WIRA SMS Service',
    status: 'Online (sandbox)',
    providerMode: process.env.SMS_API_KEY ? 'configured' : 'sandbox',
    timestamp: new Date().toISOString()
  })
})

router.post('/sms/send', (req: Request, res: Response): void => {
  const { phoneNumber, message } = req.body as {
    phoneNumber?: string
    message?: string
  }

  if (!phoneNumber || !message) {
    res.status(400).json({
      success: false,
      error: 'phoneNumber and message are required'
    })
    return
  }

  res.json({
    success: true,
    mode: process.env.SMS_API_KEY ? 'provider-ready' : 'sandbox',
    sms: {
      id: `sms-${Date.now()}`,
      to: phoneNumber,
      message,
      sentAt: new Date().toISOString(),
      provider: process.env.SMS_USERNAME ?? 'sandbox'
    }
  })
})

export default router
