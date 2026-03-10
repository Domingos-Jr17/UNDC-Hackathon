#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import winston from 'winston'

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

const prisma = new PrismaClient()

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

async function seedBaseData(): Promise<void> {
  logger.info('Seeding base entities...')

  await prisma.nGO.createMany({
    data: [
      {
        id: 'ngo-001',
        name: 'ONG Horizonte Seguro',
        contact_person: 'Equipa Técnica A',
        phone: '+258820000001',
        email: 'contato@horizonteseguro.org',
        address: 'Maputo'
      },
      {
        id: 'ngo-002',
        name: 'ONG Recomeço',
        contact_person: 'Equipa Técnica B',
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
}

async function seedUsers(): Promise<void> {
  logger.info('Seeding users...')

  const baseUsers = [
    {
      anonymous_code: 'V0042',
      ngo_id: 'ngo-001',
      role: 'VICTIM' as const
    },
    {
      anonymous_code: 'V0038',
      ngo_id: 'ngo-001',
      role: 'VICTIM' as const
    },
    {
      anonymous_code: 'V0031',
      ngo_id: 'ngo-002',
      role: 'VICTIM' as const
    }
  ]

  await prisma.user.createMany({
    data: baseUsers,
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
}

async function seedProgress(): Promise<void> {
  logger.info('Seeding progress...')

  const progressRows = [
    {
      user_code: 'V0042',
      course_id: 'costura',
      completed_modules: JSON.stringify(['1', '2', '3']),
      percentage: 38,
      current_module: 4,
      quiz_attempts: 1,
      last_quiz_score: 80
    },
    {
      user_code: 'V0038',
      course_id: 'culinaria',
      completed_modules: JSON.stringify(['1']),
      percentage: 15,
      current_module: 2,
      quiz_attempts: 0
    },
    {
      user_code: 'V0031',
      course_id: 'agricultura',
      completed_modules: JSON.stringify(['1', '2']),
      percentage: 33,
      current_module: 3,
      quiz_attempts: 1,
      last_quiz_score: 72
    }
  ]

  for (const row of progressRows) {
    await prisma.progress.upsert({
      where: {
        user_code_course_id: {
          user_code: row.user_code,
          course_id: row.course_id
        }
      },
      update: row,
      create: row
    })
  }
}

async function seedCertificates(): Promise<void> {
  logger.info('Seeding certificates...')

  await prisma.certificate.upsert({
    where: { verification_code: 'WIRA-V0031-COSTURA-2026-001' },
    update: {},
    create: {
      id: 'cert-001',
      anonymous_code: 'V0031',
      course_id: 'costura',
      course_title: 'Costura Avançada',
      verification_code: 'WIRA-V0031-COSTURA-2026-001',
      qr_code: 'https://verify.wira.org/WIRA-V0031-COSTURA-2026-001',
      instructor: 'Mentora Técnica 1',
      institution: 'WIRA Academy',
      score: 88,
      max_score: 100,
      verified: false
    }
  })
}

async function seedJobs(): Promise<void> {
  logger.info('Seeding jobs...')

  await prisma.job.createMany({
    data: [
      {
        id: 'job-003',
        title: 'Assistente de Produção Têxtil',
        description: 'Apoio na produção e acabamento de peças.',
        location: 'Maputo',
        required_skills: 'costura,controle-de-qualidade',
        contract_type: 'FULL_TIME',
        schedule: '08:00-17:00',
        salary_range: '11.000-15.000 MZN',
        ngo_id: 'ngo-001',
        employer_id: 'emp-001'
      },
      {
        id: 'job-004',
        title: 'Ajudante de Cozinha Industrial',
        description: 'Pré-preparo de alimentos e suporte operacional.',
        location: 'Matola',
        required_skills: 'culinaria,higiene,organizacao',
        contract_type: 'FULL_TIME',
        schedule: '07:00-16:00',
        salary_range: '10.500-13.000 MZN',
        ngo_id: 'ngo-001',
        employer_id: 'emp-002'
      }
    ],
    skipDuplicates: true
  })
}

async function seedCourseContent(): Promise<void> {
  logger.info('Seeding course modules and quiz questions...')

  await prisma.courseModule.createMany({
    data: [
      {
        course_id: 'costura',
        module_number: 1,
        title: 'Introducao a Maquina de Costura',
        description: 'Preparacao inicial da maquina e seguranca operacional.',
        duration_minutes: 45,
        video_url: 'https://cdn.wira.training/costura-mod1.mp4',
        downloadable: true
      },
      {
        course_id: 'costura',
        module_number: 2,
        title: 'Tipos de Tecidos',
        description: 'Selecionar tecidos para uniforme escolar e ajuste de tensao.',
        duration_minutes: 60,
        video_url: 'https://cdn.wira.training/costura-mod2.mp4',
        downloadable: true
      },
      {
        course_id: 'costura',
        module_number: 3,
        title: 'Pontos Basicos',
        description: 'Pontos retos e reforco de acabamento.',
        duration_minutes: 70,
        video_url: 'https://cdn.wira.training/costura-mod3.mp4',
        downloadable: true
      },
      {
        course_id: 'culinaria',
        module_number: 1,
        title: 'Higiene e Seguranca Alimentar',
        description: 'Boas praticas e manipulacao segura de alimentos.',
        duration_minutes: 40,
        video_url: 'https://cdn.wira.training/culinaria-mod1.mp4',
        downloadable: true
      },
      {
        course_id: 'culinaria',
        module_number: 2,
        title: 'Tecnicas de Corte',
        description: 'Cortes padrao para producao em escala.',
        duration_minutes: 55,
        video_url: 'https://cdn.wira.training/culinaria-mod2.mp4',
        downloadable: true
      },
      {
        course_id: 'agricultura',
        module_number: 1,
        title: 'Preparacao do Solo',
        description: 'Conservacao, pH e enriquecimento organico.',
        duration_minutes: 50,
        video_url: 'https://cdn.wira.training/agricultura-mod1.mp4',
        downloadable: true
      },
      {
        course_id: 'agricultura',
        module_number: 2,
        title: 'Irrigacao Eficiente',
        description: 'Manejo de agua e tecnicas de gotejamento.',
        duration_minutes: 45,
        video_url: 'https://cdn.wira.training/agricultura-mod2.mp4',
        downloadable: true
      }
    ],
    skipDuplicates: true
  })

  await prisma.courseQuizQuestion.createMany({
    data: [
      {
        course_id: 'costura',
        position: 1,
        question_text: 'Qual e o primeiro passo ao costurar um bolso?',
        options_json: JSON.stringify([
          'Cortar o tecido',
          'Preparar acabamento das bordas',
          'Costurar diretamente na peca',
          'Medir e marcar a posicao'
        ]),
        correct_answer: 3,
        explanation: 'Marcar a posicao garante alinhamento e padrao de qualidade.'
      },
      {
        course_id: 'costura',
        position: 2,
        question_text: 'Qual ajuste muda conforme a espessura do tecido?',
        options_json: JSON.stringify([
          'Cor da linha',
          'Tensao da linha',
          'Altura da cadeira',
          'Tipo de tomada'
        ]),
        correct_answer: 1,
        explanation: 'Tecidos diferentes exigem ajuste de tensao para pontos consistentes.'
      },
      {
        course_id: 'culinaria',
        position: 1,
        question_text: 'Qual temperatura interna minima e segura para frango?',
        options_json: JSON.stringify(['60C', '68C', '74C', '80C']),
        correct_answer: 2,
        explanation: '74C reduz risco microbiologico em preparacoes com frango.'
      },
      {
        course_id: 'culinaria',
        position: 2,
        question_text: 'O que significa mise en place?',
        options_json: JSON.stringify([
          'Metodo de fritura',
          'Organizacao previa de ingredientes',
          'Temperatura de forno',
          'Tipo de faca'
        ]),
        correct_answer: 1,
        explanation: 'Organizar antes do preparo aumenta seguranca e produtividade.'
      },
      {
        course_id: 'agricultura',
        position: 1,
        question_text: 'Qual tecnica economiza mais agua na irrigacao?',
        options_json: JSON.stringify(['Sulcos', 'Inundacao', 'Aspersao', 'Gotejamento']),
        correct_answer: 3,
        explanation: 'Gotejamento aplica agua diretamente na raiz com menor perda.'
      },
      {
        course_id: 'agricultura',
        position: 2,
        question_text: 'Faixa de pH mais comum para horticolas?',
        options_json: JSON.stringify(['4.0-5.0', '5.5-6.5', '7.5-8.5', '8.5-9.0']),
        correct_answer: 1,
        explanation: 'A maioria das horticolas performa melhor em solo levemente acido.'
      }
    ],
    skipDuplicates: true
  })
}

async function main(): Promise<void> {
  try {
    logger.info('Starting seed...')
    await prisma.$connect()
    await seedBaseData()
    await seedUsers()
    await seedProgress()
    await seedCertificates()
    await seedJobs()
    await seedCourseContent()
    logger.info('Seed completed successfully')
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Seed failed', { error: (error as Error).message })
    process.exit(1)
  })
}

export { main as seedData }

