import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const STAFF_ACCOUNTS = [
  {
    anonymous_code: 'ADMIN001',
    email: 'admin@wira.org',
    password: 'admin123',
    role: 'ADMIN',
    real_name: 'Administrador WIRA',
    ngo_id: 'ONG-001',
    phone: '+25882123456789'
  },
  {
    anonymous_code: 'STAFF001',
    email: 'staff001@ong-001.org',
    password: 'staff123',
    role: 'STAFF',
    real_name: 'Equipe A',
    ngo_id: 'ONG-001',
    phone: '+25882123456780'
  },
  {
    anonymous_code: 'STAFF002',
    email: 'staff002@ong-002.org',
    password: 'joao123',
    role: 'STAFF',
    real_name: 'Equipe B',
    ngo_id: 'ONG-002',
    phone: '+25882123456781'
  },
  {
    anonymous_code: 'STAFF003',
    email: 'staff003@ong-001.org',
    password: 'ana123',
    role: 'STAFF',
    real_name: 'Equipe C',
    ngo_id: 'ONG-001',
    phone: '+25882123456782'
  }
];

const NGOS = [
  {
    id: 'ONG-001',
    name: 'Centro de Acolhimento Maputo',
    contact_person: 'Contato A',
    phone: '+25882123456789',
    email: 'contact@ong-001.org',
    address: 'Av. Eduardo Mondlane 1234, Maputo',
    license_number: 'ONG-2025-001'
  },
  {
    id: 'ONG-002',
    name: 'Projeto Esperança',
    contact_person: 'Contato B',
    phone: '+25882123456790',
    email: 'contato@projeto-esperanca.org',
    address: 'Rua da Esperança 456, Beira',
    license_number: 'ONG-2025-002'
  }
];

async function seedStaffAccounts() {
  try {
    console.log('🌱 Seeding staff accounts and NGOs...');

    // First, ensure NGOs exist
    for (const ngo of NGOS) {
      await prisma.nGO.upsert({
        where: { id: ngo.id },
        update: {
          name: ngo.name,
          contact_person: ngo.contact_person,
          phone: ngo.phone,
          email: ngo.email,
          address: ngo.address,
          license_number: ngo.license_number,
          updated_at: new Date()
        },
        create: {
          id: ngo.id,
          name: ngo.name,
          contact_person: ngo.contact_person,
          phone: ngo.phone,
          email: ngo.email,
          address: ngo.address,
          license_number: ngo.license_number,
          is_active: true
        }
      });
    }

    // Then, create staff accounts
    for (const staff of STAFF_ACCOUNTS) {
      const hashedPassword = await bcrypt.hash(staff.password, 12);

      await prisma.user.upsert({
        where: { anonymous_code: staff.anonymous_code },
        update: {
          email: staff.email,
          password: hashedPassword,
          role: staff.role as any,
          real_name: staff.real_name,
          ngo_id: staff.ngo_id,
          phone: staff.phone,
          email_verified: true,
          updated_at: new Date()
        },
        create: {
          anonymous_code: staff.anonymous_code,
          email: staff.email,
          password: hashedPassword,
          role: staff.role as any,
          real_name: staff.real_name,
          ngo_id: staff.ngo_id,
          phone: staff.phone,
          email_verified: true,
          is_active: true
        }
      });

      console.log(`✅ Created ${staff.role} account: ${staff.email} (${staff.anonymous_code})`);
    }

    console.log('🎉 Staff accounts seeded successfully!');
    console.log('\n📋 Staff Login Credentials:');
    console.log('=====================================');

    STAFF_ACCOUNTS.forEach(staff => {
      console.log(`${staff.role.toUpperCase()}: ${staff.email}`);
      console.log(`Code: ${staff.anonymous_code}`);
      console.log(`Password: ${staff.password}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error seeding staff accounts:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedStaffAccounts()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default seedStaffAccounts;
