import { Router, Request, Response } from 'express'
import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'
import prismaService from '../services/prisma'
import { logger, requireStaffRole } from '../middleware/security'

const router = Router()
const prisma = prismaService.getClient()

router.use(requireStaffRole)

const normalizeNgoId = (value: string): string => value.trim().toLowerCase().replace(/^ong-/, 'ngo-')

const parseDate = (value: string | undefined, endOfDay: boolean): Date | undefined => {
  if (!value) {
    return undefined
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return undefined
  }

  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999)
  } else {
    parsed.setHours(0, 0, 0, 0)
  }

  return parsed
}

const setDownloadHeaders = (res: Response, filename: string, contentType: string): void => {
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
}

const truncateText = (value: string, maxChars: number): string => {
  if (value.length <= maxChars) {
    return value
  }
  return `${value.slice(0, Math.max(0, maxChars - 1))}...`
}

const writePdfTable = (
  res: Response,
  title: string,
  headers: string[],
  rows: string[][],
  columnWidths: number[]
): void => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' })
  doc.pipe(res)

  doc.font('Helvetica-Bold').fontSize(16).text(title)
  doc.moveDown(1)

  const rowHeight = 18
  const startX = doc.page.margins.left
  const usableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right
  const normalizedWidths = columnWidths.length === headers.length
    ? columnWidths
    : Array(headers.length).fill(Math.floor(usableWidth / headers.length))

  const drawHeader = (): number => {
    let x = startX
    const y = doc.y
    doc.font('Helvetica-Bold').fontSize(9)
    headers.forEach((header, index) => {
      doc.text(header, x, y, { width: normalizedWidths[index], lineBreak: false })
      x += normalizedWidths[index]
    })
    return y + rowHeight
  }

  let currentY = drawHeader()

  doc.font('Helvetica').fontSize(9)
  rows.forEach(row => {
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage()
      currentY = drawHeader()
      doc.font('Helvetica').fontSize(9)
    }

    let x = startX
    row.forEach((cell, index) => {
      const width = normalizedWidths[index] ?? 80
      const maxChars = Math.max(6, Math.floor(width / 5))
      const safeCell = truncateText(cell ?? '', maxChars)
      doc.text(safeCell, x, currentY, { width, lineBreak: false })
      x += width
    })
    currentY += rowHeight
  })

  doc.end()
}

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  const format = String(req.query.format ?? 'xlsx').toLowerCase()
  if (!['xlsx', 'pdf'].includes(format)) {
    res.status(400).json({ error: 'Formato invalido. Use xlsx ou pdf.' })
    return
  }

  const status = req.query.status ? String(req.query.status) : undefined
  const ngoId = req.query.ngoId ? String(req.query.ngoId) : undefined
  const from = parseDate(req.query.from ? String(req.query.from) : undefined, false)
  const to = parseDate(req.query.to ? String(req.query.to) : undefined, true)

  const statusFilter = status === 'Ativo' ? true : status === 'Inativo' ? false : undefined

  const where = {
    role: 'VICTIM' as const,
    ...(statusFilter === undefined ? {} : { is_active: statusFilter }),
    ...(ngoId ? { ngo_id: normalizeNgoId(ngoId) } : {}),
    ...(from || to
      ? {
        created_at: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {})
        }
      }
      : {})
  }

  try {
    const users = await prisma.user.findMany({
      where,
      include: {
        progresses: {
          select: { percentage: true }
        },
        certificates: {
          where: { revoked: false },
          select: { id: true }
        }
      },
      orderBy: { created_at: 'desc' }
    })

    const rows = users.map(user => {
      const progresses = user.progresses ?? []
      const certificates = user.certificates ?? []
      const totalProgress = progresses.length > 0
        ? Math.round(progresses.reduce((acc, item) => acc + item.percentage, 0) / progresses.length)
        : 0

      return {
        anonymousCode: user.anonymous_code,
        ngoId: user.ngo_id ?? '',
        status: user.is_active ? 'Ativo' : 'Inativo',
        totalProgress,
        coursesCompleted: progresses.filter(item => item.percentage >= 100).length,
        certificatesEarned: certificates.length,
        lastActivity: (user.last_login_at ?? user.created_at).toISOString(),
        createdAt: user.created_at.toISOString()
      }
    })

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Usuarios')

      sheet.columns = [
        { header: 'Codigo', key: 'anonymousCode', width: 12 },
        { header: 'ONG', key: 'ngoId', width: 14 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Progresso (%)', key: 'totalProgress', width: 14 },
        { header: 'Cursos Concluidos', key: 'coursesCompleted', width: 18 },
        { header: 'Certificados', key: 'certificatesEarned', width: 14 },
        { header: 'Ultima Atividade', key: 'lastActivity', width: 22 },
        { header: 'Criado em', key: 'createdAt', width: 22 }
      ]

      sheet.addRows(rows)
      sheet.getRow(1).font = { bold: true }

      setDownloadHeaders(res, 'wira-users-report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      await workbook.xlsx.write(res)
      res.end()
      return
    }

    setDownloadHeaders(res, 'wira-users-report.pdf', 'application/pdf')
    writePdfTable(
      res,
      'Relatorio de Usuarios',
      ['Codigo', 'ONG', 'Status', 'Progresso', 'Cursos', 'Certificados', 'Ultima Atividade'],
      rows.map(row => [
        row.anonymousCode,
        row.ngoId,
        row.status,
        `${row.totalProgress}%`,
        String(row.coursesCompleted),
        String(row.certificatesEarned),
        row.lastActivity
      ]),
      [70, 70, 50, 60, 55, 80, 150]
    )
  } catch (error) {
    logger.error('Error generating users report', { error: (error as Error).message })
    res.status(500).json({ error: 'Erro ao gerar relatorio de usuarios' })
  }
})

router.get('/activity', async (req: Request, res: Response): Promise<void> => {
  const format = String(req.query.format ?? 'xlsx').toLowerCase()
  if (!['xlsx', 'pdf'].includes(format)) {
    res.status(400).json({ error: 'Formato invalido. Use xlsx ou pdf.' })
    return
  }

  const action = req.query.action ? String(req.query.action) : undefined
  const from = parseDate(req.query.from ? String(req.query.from) : undefined, false)
  const to = parseDate(req.query.to ? String(req.query.to) : undefined, true)

  const where = {
    ...(action ? { action: { contains: action, mode: 'insensitive' as const } } : {}),
    ...(from || to
      ? {
        timestamp: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {})
        }
      }
      : {})
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    })

    const rows = logs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      action: log.action,
      userCode: log.user_code ?? 'system',
      tableName: log.table_name ?? '',
      recordId: log.record_id ?? '',
      ipAddress: log.ip_address ?? '',
      userAgent: log.user_agent ?? ''
    }))

    if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Atividade')

      sheet.columns = [
        { header: 'Data/Hora', key: 'timestamp', width: 22 },
        { header: 'Acao', key: 'action', width: 28 },
        { header: 'Usuario', key: 'userCode', width: 14 },
        { header: 'Tabela', key: 'tableName', width: 16 },
        { header: 'Registro', key: 'recordId', width: 18 },
        { header: 'IP', key: 'ipAddress', width: 16 },
        { header: 'User Agent', key: 'userAgent', width: 40 }
      ]

      sheet.addRows(rows)
      sheet.getRow(1).font = { bold: true }

      setDownloadHeaders(res, 'wira-activity-report.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      await workbook.xlsx.write(res)
      res.end()
      return
    }

    setDownloadHeaders(res, 'wira-activity-report.pdf', 'application/pdf')
    writePdfTable(
      res,
      'Relatorio de Atividade',
      ['Data/Hora', 'Acao', 'Usuario', 'Tabela', 'Registro'],
      rows.map(row => [
        row.timestamp,
        row.action,
        row.userCode,
        row.tableName,
        row.recordId
      ]),
      [120, 130, 60, 80, 80]
    )
  } catch (error) {
    logger.error('Error generating activity report', { error: (error as Error).message })
    res.status(500).json({ error: 'Erro ao gerar relatorio de atividade' })
  }
})

export default router
