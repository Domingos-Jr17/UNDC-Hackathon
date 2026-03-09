#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import winston from 'winston'

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
})

const resolveSeedStaffPassword = (): string => {
  const envPassword = process.env.SEED_STAFF_PASSWORD
  const env = process.env.NODE_ENV ?? 'development'

  if (env === 'development') {
    return envPassword ?? 'Staff@2026'
  }

  if (!envPassword) {
    throw new Error('SEED_STAFF_PASSWORD is required outside development')
  }

  return envPassword
}

async function runMigrations() {
  const prisma = new PrismaClient()

  try {
    logger.info('🔄 Starting database migrations...')

    // Check database connection
    await prisma.$connect()
    logger.info('✅ Database connected successfully')

    // Run Prisma migrations
    // Note: In a real project, you would use prisma migrate deploy
    // For this demo, we'll ensure the database is properly set up

    // Initialize default data
    await initializeDefaultData(prisma)

    logger.info('✅ Database migrations completed successfully')

  } catch (error) {
    logger.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function initializeDefaultData(prisma: PrismaClient) {
  logger.info('📝 Initializing default data...')

  await prisma.nGO.createMany({
    data: [
      {
        id: 'ngo-001',
        name: 'ONG Horizonte Seguro',
        contact_person: 'Equipe Técnica A',
        phone: '+258820000001',
        email: 'contato@horizonteseguro.org',
        address: 'Maputo'
      },
      {
        id: 'ngo-002',
        name: 'ONG Recomeço',
        contact_person: 'Equipe Técnica B',
        phone: '+258820000002',
        email: 'contato@recomeco.org',
        address: 'Beira'
      }
    ],
    skipDuplicates: true
  })

  await prisma.course.createMany({
    data: [
      {
        id: 'costura',
        title: 'Costura Avançada',
        description: 'Capacitação técnica para produção têxtil.',
        instructor: 'Mentora Técnica 1',
        duration_hours: 40,
        modules_count: 8,
        level: 'Intermediário',
        skills: 'costura,controle-de-qualidade,producao'
      },
      {
        id: 'culinaria',
        title: 'Culinária Profissional',
        description: 'Capacitação em cozinha profissional e segurança alimentar.',
        instructor: 'Mentora Técnica 2',
        duration_hours: 35,
        modules_count: 7,
        level: 'Básico',
        skills: 'culinaria,higiene,producao'
      },
      {
        id: 'agricultura',
        title: 'Agricultura Sustentável',
        description: 'Práticas de agricultura regenerativa para renda local.',
        instructor: 'Mentora Técnica 3',
        duration_hours: 30,
        modules_count: 6,
        level: 'Básico',
        skills: 'agricultura,irrigacao,colheita'
      }
    ],
    skipDuplicates: true
  })

  await prisma.courseModule.createMany({
    data: [
      {
        course_id: 'costura',
        module_number: 1,
        title: 'Introducao a maquina de costura',
        description: 'Conhecer pecas, seguranca basica e manutencao inicial.',
        duration_minutes: 30,
        video_url: 'https://cdn.wira.local/videos/costura-mod-1.mp4',
        downloadable: true
      },
      {
        course_id: 'costura',
        module_number: 2,
        title: 'Pontos basicos e acabamento',
        description: 'Treino de pontos essenciais e tecnicas de acabamento.',
        duration_minutes: 45,
        video_url: 'https://cdn.wira.local/videos/costura-mod-2.mp4',
        downloadable: true
      },
      {
        course_id: 'culinaria',
        module_number: 1,
        title: 'Higiene e seguranca alimentar',
        description: 'Boas praticas para manipulacao de alimentos.',
        duration_minutes: 35,
        video_url: 'https://cdn.wira.local/videos/culinaria-mod-1.mp4',
        downloadable: false
      },
      {
        course_id: 'agricultura',
        module_number: 1,
        title: 'Planeamento de cultivo',
        description: 'Preparacao do solo e calendario de plantio.',
        duration_minutes: 40,
        video_url: 'https://cdn.wira.local/videos/agricultura-mod-1.mp4',
        downloadable: false
      }
    ],
    skipDuplicates: true
  })

  await prisma.courseQuizQuestion.createMany({
    data: [
      {
        course_id: 'costura',
        position: 1,
        question_text: 'Qual item deve ser verificado antes de ligar a maquina?',
        options_json: JSON.stringify(['Linha e agulha', 'Somente pedal', 'Apenas iluminacao', 'Nada']),
        correct_answer: 1,
        explanation: 'Linha, agulha e estado geral da maquina devem ser verificados antes do uso.'
      },
      {
        course_id: 'costura',
        position: 2,
        question_text: 'Qual objetivo principal do acabamento?',
        options_json: JSON.stringify(['Reduzir tempo', 'Melhorar durabilidade', 'Aumentar ruido', 'Ignorar defeitos']),
        correct_answer: 2,
        explanation: 'Um bom acabamento aumenta a qualidade e a durabilidade da peca.'
      },
      {
        course_id: 'culinaria',
        position: 1,
        question_text: 'Qual pratica evita contaminacao cruzada?',
        options_json: JSON.stringify(['Mesma tabua para tudo', 'Separar utensilios por alimento', 'Nao lavar as maos', 'Misturar cru com cozido']),
        correct_answer: 2,
        explanation: 'Separar utensilios para alimentos crus e cozidos reduz risco de contaminacao.'
      },
      {
        course_id: 'agricultura',
        position: 1,
        question_text: 'O que e essencial no planeamento de cultivo?',
        options_json: JSON.stringify(['Ignorar clima', 'Calendario e analise do solo', 'Plantar sem espacamento', 'Irrigar ao acaso']),
        correct_answer: 2,
        explanation: 'Planeamento considera clima, solo e calendario para melhorar produtividade.'
      }
    ],
    skipDuplicates: true
  })

  await prisma.employer.createMany({
    data: [
      {
        id: 'emp-001',
        name: 'Textil Maputo Lda',
        location: 'Maputo',
        contact_name: 'RH 01',
        contact_phone: '+258821000001',
        contact_email: 'rh@textilmaputo.co.mz'
      },
      {
        id: 'emp-002',
        name: 'Sabores do Sul',
        location: 'Matola',
        contact_name: 'RH 02',
        contact_phone: '+258821000002',
        contact_email: 'rh@saboresdosul.co.mz'
      }
    ],
    skipDuplicates: true
  })

  await prisma.job.createMany({
    data: [
      {
        id: 'job-001',
        title: 'Costureira Industrial Júnior',
        description: 'Apoio em linha de produção de uniformes escolares.',
        location: 'Maputo',
        required_skills: 'costura,producao',
        contract_type: 'FULL_TIME',
        schedule: '08:00-17:00',
        salary_range: '12.000-16.000 MZN',
        ngo_id: 'ngo-001',
        employer_id: 'emp-001'
      },
      {
        id: 'job-002',
        title: 'Auxiliar de Cozinha',
        description: 'Preparação de alimentos e organização de cozinha profissional.',
        location: 'Matola',
        required_skills: 'culinaria,higiene',
        contract_type: 'FULL_TIME',
        schedule: '07:00-16:00',
        salary_range: '10.000-14.000 MZN',
        ngo_id: 'ngo-001',
        employer_id: 'emp-002'
      }
    ],
    skipDuplicates: true
  })

  const staffPassword = await bcrypt.hash(resolveSeedStaffPassword(), 10)

  await prisma.user.createMany({
    data: [
      {
        anonymous_code: 'A0001',
        email: 'staff@wira.org',
        password: staffPassword,
        role: 'STAFF',
        ngo_id: 'ngo-001'
      },
      {
        anonymous_code: 'A0002',
        email: 'admin@wira.org',
        password: staffPassword,
        role: 'ADMIN',
        ngo_id: 'ngo-001'
      }
    ],
    skipDuplicates: true
  })

  logger.info('✅ Default data initialization completed')
}

// Run migrations
if (require.main === module) {
  runMigrations()
}

export { runMigrations, initializeDefaultData }
