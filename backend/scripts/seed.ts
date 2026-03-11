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
        skills: 'costura,controlo-de-qualidade,producao'
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
        description: 'Práticas de agricultura regenerativa para rendimento local.',
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
        required_skills: 'costura,controlo-de-qualidade',
        contract_type: 'FULL_TIME',
        schedule: '08:00-17:00',
        salary_range: '11.000-15.000 MZN',
        ngo_id: 'ngo-001',
        employer_id: 'emp-001'
      },
      {
        id: 'job-004',
        title: 'Ajudante de Cozinha Industrial',
        description: 'Pré-preparo de alimentos e apoio operacional.',
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
          description: 'Organização do posto de trabalho, postura correcta e verificação inicial da máquina.',
          duration_minutes: 35,
          video_url: sewingVideoUrl,
          pdf_url: sewingPdfUrl,
          downloadable: true,
          text_content: [
            'Antes de iniciar qualquer actividade de costura, a bancada deve estar limpa, estável e com iluminação suficiente para permitir a leitura exacta das marcações no tecido. A cadeira deve ser ajustada de forma a manter as costas direitas, os ombros relaxados e os pés bem apoiados, evitando fadiga ao longo da sessão.',
            'A máquina precisa de uma revisão breve antes de cada utilização: confirmar a agulha, testar o pedal, observar o estado do fio superior e da bobina, e verificar se não há resíduos presos nos dentes de arrasto. Esta rotina simples reduz falhas, previne acidentes e ajuda a manter uma costura mais regular desde o primeiro minuto de trabalho.',
            'Também é essencial definir um lugar fixo para tesoura, fita métrica, alfinetes, giz e linhas. Quando o material está organizado, a formanda perde menos tempo, evita movimentos bruscos perto da agulha e consegue concentrar-se melhor no objectivo do módulo. Segurança e disciplina começam muito antes do primeiro ponto.'
          ].join('\n\n')
        },
        {
          module_number: 2,
          title: 'Conhecer tecidos e linhas',
          description: 'Selecção de materiais conforme a peça, o uso pretendido e o tipo de acabamento.',
          duration_minutes: 40,
          downloadable: false,
          text_content: [
            'Nem todos os tecidos se comportam da mesma maneira. Tecidos leves, como popeline ou viscose, exigem agulhas mais finas, tensão mais controlada e corte cuidadoso para evitar deformações. Tecidos médios ou grossos, como ganga, brim ou sarja, pedem linhas mais resistentes e maior atenção à passagem da agulha.',
            'Antes de cortar, é importante observar a elasticidade, a espessura, a textura e a direcção do fio do tecido. Uma escolha errada pode comprometer o caimento da peça, provocar rugas indesejadas ou causar desgaste prematuro nas zonas de maior esforço. Por isso, o reconhecimento do material faz parte do trabalho técnico e não deve ser tratado como detalhe secundário.',
            'O mesmo princípio vale para as linhas: a cor, a resistência e a espessura devem acompanhar o tecido e o fim de uso da peça. Em produção para venda, esta decisão afecta não só a aparência final, mas também a durabilidade e a confiança do cliente. Conhecer materiais é, portanto, uma competência prática com impacto directo na qualidade.'
          ].join('\n\n')
        },
        {
          module_number: 3,
          title: 'Medição e corte com precisão',
          description: 'Marcação correcta, margens de costura e melhor aproveitamento do tecido.',
          duration_minutes: 45,
          downloadable: false,
          text_content: [
            'Medir bem é o primeiro passo para costurar com consistência. Antes do corte, todas as medidas devem ser confirmadas com calma, de preferência duas vezes, usando fita métrica íntegra e uma superfície plana. O giz ou marcador próprio para tecido deve ser visível sem danificar o material, permitindo acompanhar linhas de corte e pontos de referência.',
            'As margens de costura precisam de ser definidas de forma uniforme. Quando a margem muda sem controlo, a peça perde simetria, o encaixe entre partes fica comprometido e o retrabalho torna-se quase inevitável. Além disso, um corte impreciso gera desperdício de tecido, reduz a produtividade e dificulta a repetição do mesmo modelo em série.',
            'Uma profissional atenta aprende a planear a disposição das partes sobre o tecido antes de cortar. Esse planeamento ajuda a aproveitar melhor o material, respeita a direcção do fio e evita perdas em projectos pequenos e grandes. O corte não é apenas execução; é também leitura, cálculo e gestão de recursos.'
          ].join('\n\n')
        },
        {
          module_number: 4,
          title: 'Pontos básicos e controlo da tensão',
          description: 'Ponto recto, retrocesso e ajustes que garantem regularidade na costura.',
          duration_minutes: 50,
          downloadable: false,
          text_content: [
            'O ponto recto é a base de grande parte das peças de vestuário e de muitos trabalhos utilitários. Apesar de parecer simples, ele depende de uma combinação correcta entre agulha, linha, tecido e regulação da máquina. Por isso, deve existir sempre um teste em retalho antes de avançar para o material definitivo.',
            'Quando o ponto apresenta folga, repuxa o tecido ou cria laçadas num dos lados, normalmente há problema de tensão, de passagem do fio ou de compatibilidade entre materiais. A solução não é insistir na costura final, mas sim parar, analisar e corrigir. Esta pausa técnica evita danos maiores e poupa tempo de reparação.',
            'O retrocesso também merece treino específico, porque é ele que fixa o início e o fim da costura em muitos contextos. Um bom controlo da tensão, aliado a arranque e fecho correctos, transmite profissionalismo, resistência e melhor acabamento. A qualidade de uma peça vê-se muitas vezes nos detalhes menos vistosos.'
          ].join('\n\n')
        },
        {
          module_number: 5,
          title: 'Montagem de painéis e bainhas',
          description: 'União das partes principais e acabamento inferior com alinhamento consistente.',
          duration_minutes: 55,
          downloadable: false,
          text_content: [
            'Na montagem de painéis, o alinhamento das bordas define a forma final da peça. Antes de costurar, convém fixar as partes com alfinetes ou alinhavo, sobretudo quando o tecido desliza ou quando há curvas e encaixes sensíveis. Esta preparação permite corrigir desvios antes de a costura ficar definitiva.',
            'Ao longo da união, a costureira deve observar se as margens permanecem constantes e se não se formam pequenas tensões que deformem o tecido. Depois da montagem, é útil abrir ou assentar as costuras com cuidado, conforme o modelo, para melhorar a apresentação e facilitar acabamentos posteriores.',
            'A bainha é um dos sinais mais visíveis de rigor técnico. Quando é mal marcada ou cosida de forma irregular, a peça perde elegância e aparenta menor valor. Uma bainha estável, direita e bem passada protege o tecido contra desgaste e reforça a percepção de qualidade no momento da entrega ou venda.'
          ].join('\n\n')
        },
        {
          module_number: 6,
          title: 'Colocação de bolsos e reforços',
          description: 'Aplicação de componentes funcionais com resistência, simetria e acabamento limpo.',
          duration_minutes: 50,
          downloadable: false,
          text_content: [
            'Os bolsos combinam função e estética, por isso a sua colocação deve respeitar medidas, alturas e alinhamentos muito claros. Antes de fixar, é importante marcar o centro, conferir a distância entre lados e observar a posição da peça no corpo ou no uso previsto. Um bolso torto compromete imediatamente a percepção de qualidade.',
            'Nos cantos e nas zonas de maior esforço, a costura de reforço é indispensável. Estes pequenos acabamentos fazem grande diferença na durabilidade da peça, sobretudo quando se trata de roupa de trabalho, aventais, uniformes ou peças de uso frequente. Reforçar não é exagerar; é prevenir desgaste prematuro.',
            'A aplicação de reforços também ensina uma lógica importante: costurar para durar. Em contextos de formação para empregabilidade ou auto-rendimento, este cuidado ajuda a produzir peças mais fiáveis, reduz reclamações e constrói reputação profissional. O módulo ensina técnica, mas também responsabilidade pelo resultado final.'
          ].join('\n\n')
        },
        {
          module_number: 7,
          title: 'Revisão de qualidade',
          description: 'Inspecção visual, limpeza de fios e correcção de falhas antes da entrega.',
          duration_minutes: 35,
          downloadable: false,
          text_content: [
            'A revisão final deve ser feita com a peça aberta, observando o lado direito e o avesso. É o momento de procurar pontos saltados, linhas frouxas, costuras tortas, marcas de giz não removidas e diferenças de simetria. Quanto mais cedo estas falhas forem detectadas, mais simples será corrigi-las.',
            'Também convém cortar pontas de linha, limpar resíduos e verificar se todos os componentes estão firmes. Uma peça pode estar funcional, mas ainda assim parecer descuidada se não passar por esta etapa de revisão estética. O acabamento transmite respeito pelo trabalho e pela pessoa que vai usar ou comprar a peça.',
            'Em ambiente profissional, a revisão de qualidade protege a reputação da costureira, reduz devoluções e cria confiança. Por isso, este módulo não deve ser entendido como mera formalidade. Rever é uma competência técnica e comercial ao mesmo tempo: melhora o produto e fortalece a credibilidade de quem o produz.'
          ].join('\n\n')
        },
        {
          module_number: 8,
          title: 'Preparação para entrega ou venda',
          description: 'Apresentação da peça, cálculo simples de custos e comunicação com o cliente.',
          duration_minutes: 30,
          downloadable: false,
          text_content: [
            'Uma peça pronta para entrega deve estar limpa, dobrada ou pendurada de forma cuidada e, sempre que possível, passada a ferro. A apresentação influencia a confiança do cliente antes mesmo de qualquer prova. Pequenos gestos, como remover fios soltos ou proteger a peça durante o transporte, aumentam o valor percebido.',
            'Este módulo introduz também noções simples de cálculo: registar gasto de tecido, acessórios, tempo investido e preço final. Sem esta informação, torna-se difícil perceber se o trabalho está a gerar rendimento justo. Saber calcular custos ajuda a definir preços sustentáveis e a negociar com maior segurança.',
            'Por fim, a relação com o cliente exige comunicação clara. Explicar medidas, cuidados de lavagem, prazo de entrega e limites do serviço reduz mal-entendidos e fortalece a confiança. A costura como actividade económica não depende só de técnica; depende igualmente de organização, apresentação e responsabilidade comercial.'
          ].join('\n\n')
        }
      ]
    },
    {
      course_id: 'culinaria',
      modules: [
        {
          module_number: 1,
          title: 'Higiene pessoal e da cozinha',
          description: 'Rotinas essenciais para reduzir contaminação e manter um serviço seguro.',
          duration_minutes: 35,
          downloadable: false,
          text_content: [
            'A higiene pessoal é uma das primeiras barreiras de protecção em qualquer cozinha. Lavar as mãos correctamente, manter unhas curtas, usar avental limpo e prender o cabelo são medidas básicas que reduzem riscos de contaminação. Estas práticas devem acontecer antes do início do trabalho e repetir-se sempre que houver mudança de tarefa.',
            'O mesmo cuidado precisa de ser aplicado às superfícies, facas, tábuas e recipientes. Utensílios usados com alimentos crus não devem passar directamente para alimentos cozinhados ou prontos a servir. A separação de tarefas evita contaminação cruzada e protege a saúde de quem consome.',
            'Num contexto profissional, higiene não é apenas boa prática; é critério de confiança. Quem cozinha para venda ou para grupos precisa de mostrar regularidade e disciplina. Este módulo reforça a ideia de que qualidade alimentar começa com hábitos simples, consistentes e observáveis no dia-a-dia.'
          ].join('\n\n')
        },
        {
          module_number: 2,
          title: 'Organização do posto de trabalho',
          description: 'Mise en place, ordem e segurança para cozinhar com ritmo e menor desperdício.',
          duration_minutes: 30,
          downloadable: false,
          text_content: [
            'Organizar o posto de trabalho antes de cozinhar permite ganhar tempo e reduzir erros. Ingredientes medidos, utensílios preparados, recipientes identificados e superfícies limpas tornam o processo mais fluido, sobretudo quando o serviço exige rapidez. A preparação prévia também ajuda a manter a mente focada e evita improvisos desnecessários.',
            'A lógica da mise en place não serve apenas restaurantes; é útil em qualquer cozinha de formação, venda local ou produção doméstica. Quando cada elemento tem um lugar definido, fica mais fácil controlar quantidades, cumprir tempos de cozedura e manter a limpeza durante toda a actividade.',
            'Além disso, um posto organizado melhora a segurança. Menos objectos espalhados significam menor risco de cortes, quedas, queimaduras ou trocas de ingredientes. Trabalhar com ordem é uma competência profissional que aumenta a produtividade e transmite maior confiança à equipa e aos clientes.'
          ].join('\n\n')
        },
        {
          module_number: 3,
          title: 'Cortes fundamentais',
          description: 'Padronização de legumes, ervas e proteínas para cozedura uniforme e boa apresentação.',
          duration_minutes: 40,
          downloadable: false,
          text_content: [
            'Aprender a cortar bem melhora o aspecto visual do prato e a regularidade da cozedura. Pedaços de tamanho semelhante cozinham ao mesmo ritmo, evitando alimentos crus numa parte e demasiado cozinhados noutra. Esta uniformidade é especialmente importante quando se trabalha em quantidade ou com receitas repetidas.',
            'A técnica começa com postura correcta, pega firme da faca e protecção dos dedos. A tábua deve estar estável, limpa e adequada ao tipo de ingrediente. O treino deve ser progressivo, começando por cortes mais simples e evoluindo para maior velocidade sem perder precisão nem segurança.',
            'Em cozinhas de produção, padronizar cortes também ajuda a calcular custos e a prever porções. Quando a preparação é consistente, o resultado torna-se mais previsível e profissional. Este módulo mostra que cortar não é só dividir ingredientes: é preparar bem a base de todo o prato.'
          ].join('\n\n')
        },
        {
          module_number: 4,
          title: 'Temperaturas seguras',
          description: 'Controlo do calor e do frio para conservar, cozinhar e servir com segurança.',
          duration_minutes: 35,
          downloadable: false,
          text_content: [
            'O controlo da temperatura é decisivo para a segurança alimentar. Alimentos crus, cozinhados e preparados com antecedência precisam de condições adequadas para não favorecer o crescimento de microrganismos. Deixar refeições demasiado tempo fora de refrigeração ou servi-las abaixo da temperatura segura aumenta o risco para quem consome.',
            'Este módulo ajuda a distinguir situações de cozedura, reaquecimento, conservação e serviço. Mais do que decorar números, interessa compreender o princípio: calor insuficiente não elimina perigos, e frio mal gerido acelera a deterioração. A observação do tempo e da temperatura deve fazer parte da rotina de qualquer cozinha responsável.',
            'A aplicação correcta destas regras evita perdas, reclamações e problemas de saúde pública. Para quem pretende trabalhar em restauração, cantinas, pastelaria ou venda informal, dominar estes fundamentos é uma vantagem prática e profissional.'
          ].join('\n\n')
        },
        {
          module_number: 5,
          title: 'Preparações de base',
          description: 'Caldos, arroz, molhos e acompanhamentos que sustentam vários menus.',
          duration_minutes: 50,
          downloadable: false,
          text_content: [
            'As preparações de base sustentam uma grande parte do trabalho culinário. Saber fazer um caldo equilibrado, um arroz solto, um molho simples ou um acompanhamento consistente permite adaptar-se a menus diferentes sem começar sempre do zero. Estas bases ajudam a organizar a produção e a responder melhor a pedidos variados.',
            'Durante o processo, é importante provar, ajustar sal, observar textura e controlar o tempo de cozedura. Pequenas correcções feitas no momento certo evitam desperdício e melhoram o resultado final. A prática repetida desenvolve sensibilidade culinária, algo que nenhum manual substitui totalmente.',
            'Quem domina bases culinárias ganha autonomia. Mesmo com poucos ingredientes ou equipamento limitado, torna-se possível cozinhar com mais regularidade, planear melhor o trabalho e oferecer refeições com qualidade estável. É esse o valor formativo deste módulo.'
          ].join('\n\n')
        },
        {
          module_number: 6,
          title: 'Apresentação e porcionamento',
          description: 'Padronização visual e controlo das quantidades para servir melhor e vender com equilíbrio.',
          duration_minutes: 35,
          downloadable: false,
          text_content: [
            'Servir bem não significa apenas encher o prato. O porcionamento correcto ajuda a equilibrar custos, respeitar o preço cobrado e manter consistência entre uma venda e outra. Quando as porções mudam sem critério, o cliente percebe instabilidade e o negócio perde controlo financeiro.',
            'Na apresentação, detalhes simples fazem diferença: limpar bordas, distribuir cores com cuidado, evitar excesso de molho sobre elementos crocantes e garantir que o prato está visualmente equilibrado. Uma boa composição melhora a experiência de quem recebe a refeição e valoriza o trabalho da cozinheira.',
            'Este módulo liga técnica, percepção de valor e sustentabilidade do serviço. Ao aprender a porcionar e apresentar com método, a formanda passa a cozinhar não só para alimentar, mas também para servir com profissionalismo e identidade.'
          ].join('\n\n')
        },
        {
          module_number: 7,
          title: 'Atendimento e produção para venda',
          description: 'Rotina operacional para cozinhar, organizar encomendas e servir clientes com confiança.',
          duration_minutes: 35,
          downloadable: false,
          text_content: [
            'Cozinhar para venda exige mais do que saber preparar alimentos. É necessário registar encomendas, controlar quantidades, antecipar horários e comunicar de forma clara com quem compra. Uma cozinha comercial depende de sabor, mas também de pontualidade, organização e fiabilidade.',
            'A produção deve estar articulada com os recursos disponíveis. Isso significa saber quanto preparar, como conservar e como ajustar o trabalho quando há alterações no volume de pedidos. Esta visão operacional evita perdas e permite responder com maior serenidade a períodos de maior procura.',
            'No contacto com o cliente, clareza e respeito são essenciais. Informar preços, prazos, opções de menu e limitações do serviço reduz conflitos e ajuda a construir reputação. O módulo fecha o curso com uma perspectiva prática: cozinhar bem é importante, mas vender bem também é uma competência.'
          ].join('\n\n')
        }
      ]
    },
    {
      course_id: 'agricultura',
      modules: [
        {
          module_number: 1,
          title: 'Leitura do terreno',
          description: 'Observação do solo, drenagem, exposição solar e limitações do espaço cultivável.',
          duration_minutes: 35,
          downloadable: false,
          text_content: [
            'Antes de plantar, é necessário observar o terreno com atenção. A inclinação, a drenagem, a exposição solar e a circulação da água influenciam directamente o sucesso da cultura. Uma boa leitura inicial ajuda a evitar decisões apressadas e orienta melhor a escolha do que pode ser plantado em cada zona.',
            'Também importa reparar na textura do solo, na presença de pedras, na facilidade de acesso e nos sinais de erosão. Estes elementos condicionam o tipo de trabalho necessário, o esforço de preparação e até os custos de manutenção. Conhecer o terreno permite planear com realismo.',
            'Este módulo desenvolve uma competência de observação que vale para pequenas machambas, hortas comunitárias ou produção familiar. Cultivar bem começa por interpretar o espaço disponível e actuar de forma compatível com as condições reais do local.'
          ].join('\n\n')
        },
        {
          module_number: 2,
          title: 'Preparação do solo',
          description: 'Matéria orgânica, limpeza e correcções básicas para melhorar fertilidade e estrutura.',
          duration_minutes: 45,
          downloadable: false,
          text_content: [
            'Preparar o solo é mais do que cavar. É preciso remover resíduos inadequados, desfazer compactações, incorporar matéria orgânica e avaliar se a terra consegue reter água e nutrientes de forma equilibrada. Um solo bem preparado favorece o enraizamento e aumenta a capacidade de resposta da planta nas primeiras semanas.',
            'A aplicação de composto ou estrume curtido, quando bem feita, melhora a estrutura do solo e reduz a dependência de soluções mais caras. No entanto, o excesso ou a utilização sem critério pode trazer novos problemas. Por isso, este módulo reforça a importância de usar recursos locais com observação e medida.',
            'Mesmo em parcelas pequenas, a preparação correcta tem impacto visível na produtividade. Um bom início reduz perdas, facilita a manutenção posterior e cria melhores condições para que a cultura se desenvolva de modo saudável e sustentável.'
          ].join('\n\n')
        },
        {
          module_number: 3,
          title: 'Sementeira e transplante',
          description: 'Espaçamento, profundidade e cuidados iniciais com sementes e mudas.',
          duration_minutes: 40,
          downloadable: false,
          text_content: [
            'Cada cultura exige profundidade, distância e ritmo próprios de instalação. Semear demasiado fundo dificulta a emergência; semear demasiado à superfície expõe a semente ao calor, à secura ou às aves. O mesmo cuidado vale para o espaçamento, que deve permitir circulação de ar, luz e acesso aos nutrientes.',
            'No transplante, a prioridade é proteger a raiz e reduzir o stress da muda. O processo deve ser feito com solo húmido, manuseamento calmo e rega logo após a mudança. Plantas transplantadas sem estes cuidados podem parar de crescer ou perder-se nas primeiras horas.',
            'Este módulo mostra como decisões aparentemente simples afectam todo o ciclo produtivo. Uma instalação correcta aumenta a taxa de sobrevivência, melhora o desenvolvimento inicial e prepara o terreno para uma colheita mais consistente.'
          ].join('\n\n')
        },
        {
          module_number: 4,
          title: 'Irrigação eficiente',
          description: 'Rotina de rega, observação da humidade e redução do desperdício de água.',
          duration_minutes: 35,
          downloadable: false,
          text_content: [
            'A água deve ser usada com critério. Regar cedo ou ao fim da tarde reduz evaporação e permite maior aproveitamento pela planta. No entanto, a frequência de rega não pode ser decidida apenas por hábito; é preciso observar a humidade do solo, o clima do dia e a fase de desenvolvimento da cultura.',
            'O excesso de água pode causar apodrecimento das raízes, favorecer doenças e desperdiçar um recurso precioso. Já a falta de rega compromete o crescimento e enfraquece a planta. O equilíbrio depende de observação contínua e de pequenas decisões ajustadas ao contexto.',
            'Ao aprender métodos simples de irrigação eficiente, a formanda ganha capacidade de produzir mais com menos desperdício. Esta é uma competência particularmente importante em contextos de escassez de água, produção familiar e gestão responsável de recursos.'
          ].join('\n\n')
        },
        {
          module_number: 5,
          title: 'Controlo de pragas e doenças',
          description: 'Monitorização do campo e resposta inicial com medidas preventivas e de baixo risco.',
          duration_minutes: 45,
          downloadable: false,
          text_content: [
            'O controlo começa com observação regular. Folhas manchadas, furos, mudanças de cor, crescimento anormal ou presença de insectos podem indicar pragas ou doenças em fase inicial. Quanto mais cedo estes sinais forem detectados, maiores são as hipóteses de intervenção eficaz sem perdas extensas.',
            'Sempre que possível, a primeira resposta deve privilegiar medidas preventivas e soluções de menor impacto: limpeza do terreno, rotação de culturas, remoção de partes afectadas e melhoria da ventilação. Produtos mais agressivos devem ser considerados com cuidado, apenas quando necessário e com orientação adequada.',
            'Este módulo promove uma abordagem responsável. Não se trata apenas de eliminar um problema imediato, mas de manter o equilíbrio da produção e proteger a saúde da terra, da pessoa que cultiva e de quem vai consumir o alimento.'
          ].join('\n\n')
        },
        {
          module_number: 6,
          title: 'Colheita e comercialização local',
          description: 'Momento certo de colheita, conservação inicial e organização básica para venda.',
          duration_minutes: 35,
          downloadable: false,
          text_content: [
            'Colher no momento adequado faz diferença no sabor, no peso, na resistência ao transporte e no valor de mercado. Uma colheita demasiado cedo pode reduzir qualidade; demasiado tarde pode aumentar perdas. Por isso, este módulo trabalha sinais de maturação e critérios simples para decidir o melhor momento de recolha.',
            'Depois da colheita, os produtos precisam de sombra, selecção e acondicionamento básico. Separar unidades danificadas, evitar esmagamento e manter limpeza durante o transporte ajuda a preservar o valor da produção. Mesmo em venda local, a apresentação influencia fortemente a decisão de compra.',
            'A comercialização começa na organização: registar quantidades, perceber o que vende melhor, observar preços e conversar com clientes. Com estas práticas, a produção agrícola deixa de ser apenas actividade de subsistência e pode transformar-se numa fonte de rendimento mais estável e consciente.'
          ].join('\n\n')
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
          'Costurar directamente na peca',
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
        explanation: 'Gotejamento aplica agua directamente na raiz com menor perda.'
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
