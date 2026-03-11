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

const resolveSeedPublicBaseUrl = (): string => {
  const candidate = (
    process.env.SEED_PUBLIC_BASE_URL ??
    process.env.PUBLIC_API_BASE_URL ??
    `http://localhost:${process.env.PORT ?? '3000'}`
  ).trim()

  return candidate.replace(/\/+$/, '')
}

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
  const publicBaseUrl = resolveSeedPublicBaseUrl()
  const sewingVideoUrl = `${publicBaseUrl}/media/course-content/custura.mp4`
  const sewingPdfUrl = `${publicBaseUrl}/media/course-content/custura.pdf`

  const courseModules = [
    {
      course_id: 'costura',
      modules: [
        {
          module_number: 1,
          title: 'Preparação do espaço e segurança',
          description: 'Organização da mesa, postura e revisão da máquina antes de iniciar.',
          duration_minutes: 35,
          video_url: sewingVideoUrl,
          pdf_url: sewingPdfUrl,
          downloadable: true,
          text_content:
            'Antes de começar, limpe a mesa, confirme a posição da cadeira e teste o pedal. Mantenha tesoura, fita métrica, alfinetes e linhas num local acessível. A segurança começa com atenção ao cabo de energia, iluminação adequada e mãos afastadas da agulha durante qualquer ajuste.'
        },
        {
          module_number: 2,
          title: 'Conhecer tecidos e linhas',
          description: 'Escolha de materiais conforme o tipo de peça e o uso final.',
          duration_minutes: 40,
          downloadable: false,
          text_content:
            'Tecidos leves exigem agulhas finas e menor tensão. Tecidos médios e grossos pedem linhas mais resistentes e testes prévios. Sempre compare elasticidade, espessura e resistência antes de cortar para evitar desperdício e garantir acabamento uniforme.'
        },
        {
          module_number: 3,
          title: 'Medição e corte com precisão',
          description: 'Marcação correcta, margens de costura e aproveitamento do tecido.',
          duration_minutes: 45,
          downloadable: false,
          text_content:
            'Use giz ou marcador próprio para tecido e confirme duas vezes todas as medidas. Reserve margens consistentes para costura e acabamento. Um corte preciso reduz retrabalho, melhora o caimento da peça e ajuda a manter o padrão de produção.'
        },
        {
          module_number: 4,
          title: 'Pontos básicos e controlo da tensão',
          description: 'Ponto recto, retrocesso e ajustes para costura regular.',
          duration_minutes: 50,
          downloadable: false,
          text_content:
            'O ponto recto serve como base para a maioria das peças. Faça sempre uma amostra antes de costurar o material final. Se o ponto estiver frouxo ou repuxado, ajuste a tensão da linha e teste novamente até obter regularidade nos dois lados do tecido.'
        },
        {
          module_number: 5,
          title: 'Montagem de painéis e bainhas',
          description: 'União de partes principais e acabamento inferior.',
          duration_minutes: 55,
          downloadable: false,
          text_content:
            'Ao unir painéis, alinhe bordas e fixe com alfinetes ou alinhavo. Costure de forma contínua e verifique simetria antes da bainha. Uma bainha bem marcada melhora a apresentação da peça e evita desgaste prematuro.'
        },
        {
          module_number: 6,
          title: 'Colocação de bolsos e reforços',
          description: 'Aplicação de componentes funcionais com resistência.',
          duration_minutes: 50,
          downloadable: false,
          text_content:
            'Marque a posição do bolso com referência ao centro e à altura da peça. Faça costura de reforço nos cantos e verifique se o bolso ficou plano. Reforços simples aumentam durabilidade e confiança no uso diário da peça confeccionada.'
        },
        {
          module_number: 7,
          title: 'Revisão de qualidade',
          description: 'Inspecção visual, limpeza de linhas e correcção de falhas.',
          duration_minutes: 35,
          downloadable: false,
          text_content:
            'Revise a peça por dentro e por fora. Corte pontas de linha, confirme alinhamento e procure pontos saltados. A revisão final protege a reputação do trabalho, reduz devoluções e prepara a beneficiária para responder a padrões de clientes e empregadores.'
        },
        {
          module_number: 8,
          title: 'Preparação para entrega ou venda',
          description: 'Apresentação da peça, cálculo simples e orientação ao cliente.',
          duration_minutes: 30,
          downloadable: false,
          text_content:
            'Ao entregar uma peça, apresente-a limpa, dobrada e pronta para prova. Registe custo de material, tempo gasto e preço final. Explicar cuidados básicos de lavagem e uso aumenta confiança e melhora a relação com clientes.'
        }
      ]
    },
    {
      course_id: 'culinaria',
      modules: [
        {
          module_number: 1,
          title: 'Higiene pessoal e da cozinha',
          description: 'Rotinas básicas para reduzir contaminação.',
          duration_minutes: 35,
          downloadable: false,
          text_content:
            'Lave as mãos antes de cada tarefa, use avental limpo e mantenha superfícies higienizadas. Separe utensílios de alimentos crus e cozidos. A disciplina nestes cuidados reduz risco para clientes e melhora a qualidade do serviço.'
        },
        {
          module_number: 2,
          title: 'Organização do posto de trabalho',
          description: 'Mise en place, ordem e segurança no serviço.',
          duration_minutes: 30,
          downloadable: false,
          text_content:
            'Antes de cozinhar, deixe ingredientes medidos, utensílios prontos e recipientes identificados. Trabalhar com ordem evita desperdício, acelera o serviço e ajuda a responder melhor a ambientes de cozinha com maior pressão.'
        },
        {
          module_number: 3,
          title: 'Cortes fundamentais',
          description: 'Padronização de legumes, ervas e proteínas.',
          duration_minutes: 40,
          downloadable: false,
          text_content:
            'Treinar cortes iguais melhora a cozedura e a apresentação. Mantenha os dedos protegidos, segure a faca com firmeza e estabilize a tábua. A padronização é uma competência valorizada em restauração e produção alimentar.'
        },
        {
          module_number: 4,
          title: 'Temperaturas seguras',
          description: 'Controlo de calor e conservação adequada.',
          duration_minutes: 35,
          downloadable: false,
          text_content:
            'Carnes, molhos e refeições prontas exigem atenção à temperatura. Evite deixar alimentos muito tempo fora de refrigeração. O controlo de calor e frio protege a saúde de quem consome e reduz perdas por deterioração.'
        },
        {
          module_number: 5,
          title: 'Preparações de base',
          description: 'Caldos, arroz, molhos e acompanhamento simples.',
          duration_minutes: 50,
          downloadable: false,
          text_content:
            'Dominar bases culinárias facilita a execução de menus diferentes. Ajuste sal, textura e tempo de cozedura de forma gradual. Uma boa base permite produzir refeições consistentes mesmo com recursos limitados.'
        },
        {
          module_number: 6,
          title: 'Apresentação e porcionamento',
          description: 'Padronização visual e controlo de quantidades.',
          duration_minutes: 35,
          downloadable: false,
          text_content:
            'Servir porções regulares melhora custo, previsibilidade e imagem do negócio. Limpe as bordas do prato, organize cores e texturas e confirme se o tamanho da porção corresponde ao preço cobrado.'
        },
        {
          module_number: 7,
          title: 'Atendimento e produção para venda',
          description: 'Rotina operacional para refeições comerciais.',
          duration_minutes: 35,
          downloadable: false,
          text_content:
            'Ao cozinhar para venda, é importante registar encomendas, controlar ingredientes e manter comunicação clara com clientes. A cozinha profissional depende tanto de sabor quanto de organização, pontualidade e confiança.'
        }
      ]
    },
    {
      course_id: 'agricultura',
      modules: [
        {
          module_number: 1,
          title: 'Leitura do terreno',
          description: 'Observação do solo, drenagem e exposição solar.',
          duration_minutes: 35,
          downloadable: false,
          text_content:
            'Antes de plantar, observe a inclinação do terreno, a retenção de água e a quantidade de sol ao longo do dia. Esta leitura inicial ajuda a escolher culturas adequadas e a evitar perdas por excesso de sombra ou encharcamento.'
        },
        {
          module_number: 2,
          title: 'Preparação do solo',
          description: 'Matéria orgânica, limpeza e correcções básicas.',
          duration_minutes: 45,
          downloadable: false,
          text_content:
            'A preparação do solo começa com remoção de resíduos, arejamento e incorporação de composto orgânico. Um solo equilibrado melhora enraizamento, retenção de nutrientes e produtividade, mesmo em pequenas parcelas.'
        },
        {
          module_number: 3,
          title: 'Sementeira e transplante',
          description: 'Espaçamento, profundidade e cuidado inicial das mudas.',
          duration_minutes: 40,
          downloadable: false,
          text_content:
            'Cada cultura exige profundidade e espaçamento próprios. Evite semear demasiado junto para não criar competição por luz e nutrientes. No transplante, proteja as raízes e regue logo após a mudança.'
        },
        {
          module_number: 4,
          title: 'Irrigação eficiente',
          description: 'Rotina de rega e redução de desperdício de água.',
          duration_minutes: 35,
          downloadable: false,
          text_content:
            'Regar cedo ou no fim da tarde reduz evaporação. Observe a humidade do solo antes de repetir a rega. Pequenas melhorias na frequência e no método de irrigação podem aumentar a produção sem elevar custos.'
        },
        {
          module_number: 5,
          title: 'Controlo de pragas e doenças',
          description: 'Monitorização e resposta inicial com baixo risco.',
          duration_minutes: 45,
          downloadable: false,
          text_content:
            'Inspeccione folhas, caules e frutos com regularidade. Identificar sinais cedo facilita o controlo e evita disseminação. Sempre que possível, comece com medidas preventivas e soluções de baixo impacto antes de recorrer a produtos mais agressivos.'
        },
        {
          module_number: 6,
          title: 'Colheita e comercialização local',
          description: 'Momento certo, armazenamento e venda básica.',
          duration_minutes: 35,
          downloadable: false,
          text_content:
            'Colher no momento certo preserva sabor, peso e valor de mercado. Separe produtos danificados, mantenha sombra durante o transporte e registe volumes vendidos. A gestão simples da colheita ajuda a transformar produção em rendimento estável.'
        }
      ]
    }
  ] as const

  for (const course of courseModules) {
    for (const module of course.modules) {
      await prisma.courseModule.upsert({
        where: {
          course_id_module_number: {
            course_id: course.course_id,
            module_number: module.module_number
          }
        },
        update: module,
        create: {
          course_id: course.course_id,
          ...module
        }
      })
    }
  }

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

