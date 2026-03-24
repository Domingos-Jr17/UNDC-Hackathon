import express, { Request, Response } from 'express'
import prismaService from '../services/prisma'
import { authenticateToken, ipRateLimit, logger } from '../middleware/security'
import smsProviderService from '../services/smsProvider'

const router = express.Router()
const prisma = prismaService.getClient()
const SESSION_TIMEOUT_MS = parseInt(process.env.USSD_SESSION_TIMEOUT_MS ?? '300000')
const DEFAULT_PHONE_NUMBER = '+258840000000'

type UssdMenuStep = 'welcome' | 'login' | 'main_menu' | 'courses_menu' | 'progress_menu' | 'help_menu'

interface StoredSessionPayload {
  userCode?: string
}

interface UssdResponsePayload {
  success: boolean
  sessionId: string
  response: string
  error?: string
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

const isValidPhoneNumber = (value: string): boolean => /^\+?\d{8,15}$/.test(value)

const auxEndpointsEnabled = (): boolean => {
  const env = process.env.NODE_ENV ?? 'development'

  if (env !== 'production') {
    return true
  }

  if (process.env.JEST_WORKER_ID) {
    return false
  }

  return process.env.ENABLE_USSD_AUX_ENDPOINTS === 'true'
}

const ensureAuxEndpointsEnabled = (res: Response): boolean => {
  if (auxEndpointsEnabled()) {
    return true
  }

  res.status(404).json({
    success: false,
    error: 'Endpoint indisponivel neste ambiente'
  })
  return false
}

const sendAfricasTalkingResponse = (res: Response, payload: UssdResponsePayload): void => {
  res
    .status(200)
    .type('text/plain')
    .set('Cache-Control', 'no-store')
    .send(payload.response)
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
      return {
        id: byId.id,
        step: byId.step as UssdMenuStep,
        payload: parsePayload(byId.payload)
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
  sessionId?: string
): Promise<UssdResponsePayload> {
  try {
    const session = await getOrCreateSession(sessionId, phoneNumber)
    const parts = text.trim() ? text.split('*').map(item => item.trim()) : []

    if (parts.length === 0 || session.step === 'welcome') {
      session.step = 'login'
      await saveSession({ ...session, phoneNumber })
      return {
        success: true,
        sessionId: session.id,
        response: formatResponse(false, 'WIRA\n\nBem-vinda ao WIRA.\n\nInforme o seu código de acesso (ex.: V0042):')
      }
    }

    if (session.step === 'login') {
      const inputCode = parts[parts.length - 1].toUpperCase()
      const user = await prisma.user.findUnique({
        where: { anonymous_code: inputCode },
        select: { anonymous_code: true, is_active: true }
      })

      if (!user || !user.is_active) {
        await saveSession({ ...session, phoneNumber })
        return {
          success: true,
          sessionId: session.id,
          response: formatResponse(false, 'Código inválido. Tente novamente com o formato V#### ou digite 4 para sair.')
        }
      }

      session.step = 'main_menu'
      session.payload.userCode = user.anonymous_code
      await saveSession({ ...session, phoneNumber })

      return {
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `Bem-vinda, ${user.anonymous_code}!\n\n1. Meus Cursos\n2. Meu Progresso\n3. Ajuda\n4. Sair`)
      }
    }

    const option = parts[parts.length - 1]
    const userCode = session.payload.userCode

    if (!userCode) {
      session.step = 'login'
      await saveSession({ ...session, phoneNumber })
      return {
        success: true,
        sessionId: session.id,
        response: formatResponse(false, 'Sessão sem autenticação. Informe novamente o seu código V####.')
      }
    }

    if (option === '4') {
      await prisma.ussdSession.delete({ where: { id: session.id } })
      return {
        success: true,
        sessionId: session.id,
        response: formatResponse(true, 'Obrigado por usar o WIRA. Até breve.')
      }
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

      session.step = 'courses_menu'
      await saveSession({ ...session, phoneNumber })

      if (progressRows.length === 0) {
        return {
          success: true,
          sessionId: session.id,
          response: formatResponse(false, 'Você ainda não tem cursos atribuídos.\n\n0. Voltar ao menu principal')
        }
      }

      const lines = progressRows
        .map((item: any, index: number) => `${index + 1}. ${item.course.title} - ${item.percentage}%`)
        .join('\n')

      return {
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `SEUS CURSOS:\n${lines}\n\n0. Voltar ao menu principal`)
      }
    }

    if (option === '2') {
      const summary = await resolveProgressSummary(userCode)
      session.step = 'progress_menu'
      await saveSession({ ...session, phoneNumber })

      return {
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `PROGRESSO GERAL - ${userCode}\n\nCursos activos: ${summary.totalCourses}\nMódulos concluídos: ${summary.completedModules}\nProgresso médio: ${summary.averageProgress}%\n\n0. Voltar ao menu principal`)
      }
    }

    if (option === '3') {
      session.step = 'help_menu'
      await saveSession({ ...session, phoneNumber })

      return {
        success: true,
        sessionId: session.id,
        response: formatResponse(false, 'AJUDA WIRA\n\nFormato do código: V####\nSuporte: +258 84 123 4567\nEmail: ajuda@wira.org\n\n0. Voltar ao menu principal')
      }
    }

    if (option === '0') {
      session.step = 'main_menu'
      await saveSession({ ...session, phoneNumber })
      return {
        success: true,
        sessionId: session.id,
        response: formatResponse(false, `Bem-vinda, ${userCode}!\n\n1. Meus Cursos\n2. Meu Progresso\n3. Ajuda\n4. Sair`)
      }
    }

    await saveSession({ ...session, phoneNumber })
    return {
      success: true,
      sessionId: session.id,
      response: formatResponse(false, 'Opção inválida.\n\n1. Meus Cursos\n2. Meu Progresso\n3. Ajuda\n4. Sair')
    }
  } catch (error) {
    logger.error('USSD processing error', { error: (error as Error).message })

    return {
      success: false,
      sessionId: sessionId ?? '',
      response: formatResponse(true, 'Servico temporariamente indisponivel. Tente novamente em instantes.'),
      error: 'Erro no processamento USSD'
    }
  }
}

router.post('/test', ipRateLimit(20, 15 * 60 * 1000), async (req: Request, res: Response): Promise<void> => {
  if (!ensureAuxEndpointsEnabled(res)) {
    return
  }

  const { phoneNumber = DEFAULT_PHONE_NUMBER, text = '', sessionId } = req.body as {
    phoneNumber?: string
    text?: string
    sessionId?: string
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    res.status(400).json({
      success: false,
      error: 'phoneNumber must be in international format'
    })
    return
  }

  const payload = await handleUssdRequest(phoneNumber, text, sessionId)
  res.status(payload.success ? 200 : 500).json(payload)
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  const {
    sessionId,
    serviceCode,
    phoneNumber = DEFAULT_PHONE_NUMBER,
    text = ''
  } = req.body as {
    sessionId?: string
    serviceCode?: string
    phoneNumber?: string
    text?: string
  }

  logger.info('USSD callback received', {
    sessionId,
    serviceCode,
    phoneNumber,
    textLength: text.length
  })

  if (!isValidPhoneNumber(phoneNumber)) {
    sendAfricasTalkingResponse(res, {
      success: false,
      sessionId: sessionId ?? '',
      response: formatResponse(true, 'Numero invalido. Tente novamente.'),
      error: 'phoneNumber must be in international format'
    })
    return
  }

  const payload = await handleUssdRequest(phoneNumber, text, sessionId)
  sendAfricasTalkingResponse(res, payload)
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
    provider: 'africastalking-compatible',
    shortcode: process.env.USSD_SHORTCODE ?? '*384*36224#',
    sessionTimeoutMs: SESSION_TIMEOUT_MS,
    activeSessions,
    callbackUrl: process.env.AT_USSD_CALLBACK_URL ?? null,
    timestamp: now.toISOString()
  })
})

router.get('/sms/status', (_req: Request, res: Response): void => {
  const status = smsProviderService.getStatus()
  res.json({
    success: true,
    service: 'WIRA SMS Service',
    status: 'Online',
    providerMode: status.providerMode,
    provider: status.provider,
    timestamp: new Date().toISOString()
  })
})

router.post(
  '/sms/send',
  authenticateToken,
  ipRateLimit(30, 15 * 60 * 1000),
  async (req: Request, res: Response): Promise<void> => {
    if (!ensureAuxEndpointsEnabled(res)) {
      return
    }

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

    if (!isValidPhoneNumber(phoneNumber)) {
      res.status(400).json({
        success: false,
        error: 'phoneNumber must be in international format'
      })
      return
    }

    try {
      const result = await smsProviderService.send({ phoneNumber, message })
      res.json({
        success: true,
        mode: result.mode,
        sms: {
          id: result.messageId,
          to: result.to,
          message: result.body,
          sentAt: result.sentAt,
          provider: result.provider
        }
      })
    } catch (error) {
      res.status(502).json({
        success: false,
        error: (error as Error).message
      })
    }
  }
)

export default router

