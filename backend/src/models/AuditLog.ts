import prismaService from '../services/prisma'
import { AuditLog } from '../types'

const prisma = prismaService.getClient()

const buildWhere = (where?: Partial<AuditLog>) => ({
  ...(where?.user_code ? { user_code: where.user_code } : {}),
  ...(where?.action ? { action: where.action } : {}),
  ...(where?.table_name ? { table_name: where.table_name } : {})
})

const toAuditLog = (row: {
  id: number
  user_code: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_values: string | null
  new_values: string | null
  ip_address: string | null
  user_agent: string | null
  timestamp: Date
}): AuditLog => {
  const item: AuditLog = {
    id: row.id,
    action: row.action,
    timestamp: row.timestamp.toISOString()
  }

  if (row.user_code) item.user_code = row.user_code
  if (row.table_name) item.table_name = row.table_name
  if (row.record_id) item.record_id = row.record_id
  if (row.old_values) item.old_values = row.old_values
  if (row.new_values) item.new_values = row.new_values
  if (row.ip_address) item.ip_address = row.ip_address
  if (row.user_agent) item.user_agent = row.user_agent

  return item
}

class AuditLogModel {
  static async create(logData: Partial<AuditLog>): Promise<void> {
    await prisma.auditLog.create({
      data: {
        user_code: logData.user_code ?? null,
        action: logData.action ?? 'UNSPECIFIED_ACTION',
        table_name: logData.table_name ?? null,
        record_id: logData.record_id ?? null,
        old_values: logData.old_values ?? null,
        new_values: logData.new_values ?? null,
        ip_address: logData.ip_address ?? null,
        user_agent: logData.user_agent ?? null
      }
    })
  }

  static async findByUser(userCode: string, limit = 50): Promise<AuditLog[]> {
    const rows = await prisma.auditLog.findMany({
      where: { user_code: userCode },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
    return rows.map(toAuditLog)
  }

  static async findByAction(action: string, limit = 50): Promise<AuditLog[]> {
    const rows = await prisma.auditLog.findMany({
      where: { action },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
    return rows.map(toAuditLog)
  }

  static async findByTable(tableName: string, limit = 50): Promise<AuditLog[]> {
    const rows = await prisma.auditLog.findMany({
      where: { table_name: tableName },
      orderBy: { timestamp: 'desc' },
      take: limit
    })
    return rows.map(toAuditLog)
  }

  static async findMany(args?: {
    where?: Partial<AuditLog>
    orderBy?: { timestamp: 'asc' | 'desc' }
    take?: number
    skip?: number
  }): Promise<AuditLog[]> {
    const rows = await prisma.auditLog.findMany({
      where: buildWhere(args?.where),
      orderBy: { timestamp: args?.orderBy?.timestamp ?? 'desc' },
      ...(args?.take !== undefined ? { take: args.take } : {}),
      ...(args?.skip !== undefined ? { skip: args.skip } : {})
    })
    return rows.map(toAuditLog)
  }

  static async createWithPrisma(data: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const row = await prisma.auditLog.create({
      data: {
        user_code: data.user_code ?? null,
        action: data.action,
        table_name: data.table_name ?? null,
        record_id: data.record_id ?? null,
        old_values: data.old_values ?? null,
        new_values: data.new_values ?? null,
        ip_address: data.ip_address ?? null,
        user_agent: data.user_agent ?? null
      }
    })
    return toAuditLog(row)
  }

  static async findFirst(args: {
    where?: Partial<AuditLog>
    orderBy?: { timestamp: 'asc' | 'desc' }
  }): Promise<AuditLog | null> {
    const row = await prisma.auditLog.findFirst({
      where: buildWhere(args.where),
      orderBy: { timestamp: args.orderBy?.timestamp ?? 'desc' }
    })

    return row ? toAuditLog(row) : null
  }

  static async count(where?: Partial<AuditLog>): Promise<number> {
    return prisma.auditLog.count({
      where: buildWhere(where)
    })
  }
}

export default AuditLogModel
