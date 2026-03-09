import prismaService from '../services/prisma'
import { NGO } from '../types'

const prisma = prismaService.getClient()

const toNGO = (row: {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  address: string | null
  license_number: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date | null
}): NGO => {
  const ngo: NGO = {
    id: row.id,
    name: row.name,
    is_active: row.is_active,
    created_at: row.created_at.toISOString()
  }

  if (row.contact_person) ngo.contact_person = row.contact_person
  if (row.phone) ngo.phone = row.phone
  if (row.email) ngo.email = row.email
  if (row.address) ngo.address = row.address
  if (row.license_number) ngo.license_number = row.license_number
  if (row.updated_at) ngo.updated_at = row.updated_at.toISOString()

  return ngo
}

class NGOModel {
  static async findById(id: string): Promise<NGO | null> {
    const row = await prisma.nGO.findUnique({ where: { id } })
    return row ? toNGO(row) : null
  }

  static async findAll(): Promise<NGO[]> {
    const rows = await prisma.nGO.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' }
    })
    return rows.map(toNGO)
  }

  static async create(ngoData: Partial<NGO>): Promise<string> {
    const id = ngoData.id ?? `ngo-${Date.now()}`
    await prisma.nGO.create({
      data: {
        id,
        name: ngoData.name ?? 'ONG sem nome',
        contact_person: ngoData.contact_person ?? null,
        phone: ngoData.phone ?? null,
        email: ngoData.email ?? null,
        address: ngoData.address ?? null,
        license_number: ngoData.license_number ?? null
      }
    })
    return id
  }

  static async update(id: string, ngoData: Partial<NGO>): Promise<void> {
    const updateData = {
      ...(ngoData.name !== undefined ? { name: ngoData.name } : {}),
      ...(ngoData.contact_person !== undefined ? { contact_person: ngoData.contact_person } : {}),
      ...(ngoData.phone !== undefined ? { phone: ngoData.phone } : {}),
      ...(ngoData.email !== undefined ? { email: ngoData.email } : {}),
      ...(ngoData.address !== undefined ? { address: ngoData.address } : {}),
      ...(ngoData.license_number !== undefined ? { license_number: ngoData.license_number } : {}),
      updated_at: new Date()
    }

    await prisma.nGO.update({
      where: { id },
      data: updateData
    })
  }

  static async deactivate(id: string): Promise<void> {
    await prisma.nGO.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date()
      }
    })
  }

  static async findUnique(where: { id: string }): Promise<NGO | null> {
    return this.findById(where.id)
  }

  static async findMany(): Promise<NGO[]> {
    return this.findAll()
  }

  static async createWithPrisma(data: Omit<NGO, 'id' | 'created_at' | 'updated_at' | 'is_active'>): Promise<NGO> {
    const id = `ngo-${Date.now()}`
    const row = await prisma.nGO.create({
      data: {
        id,
        name: data.name,
        contact_person: data.contact_person ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        license_number: data.license_number ?? null,
        is_active: true
      }
    })
    return toNGO(row)
  }

  static async updateWithPrisma(
    where: { id: string },
    data: Partial<Omit<NGO, 'id' | 'created_at' | 'updated_at' | 'is_active'>>
  ): Promise<NGO | null> {
    try {
      const updateData = {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.contact_person !== undefined ? { contact_person: data.contact_person } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.license_number !== undefined ? { license_number: data.license_number } : {}),
        updated_at: new Date()
      }

      const row = await prisma.nGO.update({
        where,
        data: updateData
      })
      return toNGO(row)
    } catch {
      return null
    }
  }

  static async delete(where: { id: string }): Promise<void> {
    await prisma.nGO.delete({ where })
  }
}

export default NGOModel
