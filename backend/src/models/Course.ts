import prismaService from '../services/prisma';
import { Course as CourseInterface, CourseModule, QuizQuestion } from '../types';

const prisma = prismaService.getClient();

class CourseModel {
  static async findAll(): Promise<CourseInterface[]> {
    try {
      const courses = await prisma.course.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'asc' }
      });

      return courses.map((course: any) => ({
        ...course,
        created_at: course.created_at.toISOString(),
        updated_at: course.updated_at?.toISOString()
      })) as CourseInterface[];
    } catch (error) {
      throw error;
    }
  }

  static async findById(id: string): Promise<CourseInterface | null> {
    try {
      const course = await prisma.course.findUnique({
        where: { id }
      });

      if (!course) return null;

      return {
        ...course,
        created_at: course.created_at.toISOString(),
        updated_at: course.updated_at?.toISOString()
      } as CourseInterface;
    } catch (error) {
      throw error;
    }
  }

  static async findModulesByCourseId(courseId: string): Promise<CourseModule[]> {
    // This is a simplified implementation - in a real application,
    // modules would likely be stored in a separate table
    const modules: Record<string, CourseModule[]> = {
      costura: [
        {
          id: 1,
          title: 'Preparação de Máquina Industrial',
          duration: '45 min',
          videoUrl: 'https://cdn.wira.training/costura-mod1.mp4',
          downloadable: true,
          description: 'Aprenda a configurar e preparar máquinas industriais para costura de uniformes escolares.'
        },
        {
          id: 2,
          title: 'Técnicas de Costura Reta',
          duration: '60 min',
          videoUrl: 'https://cdn.wira.training/costura-mod2.mp4',
          downloadable: true,
          description: 'Domine as técnicas fundamentais de costura reta em diferentes tipos de tecidos.'
        },
        {
          id: 3,
          title: 'Costura de Bolsos',
          duration: '50 min',
          videoUrl: 'https://cdn.wira.training/costura-mod3.mp4',
          downloadable: true,
          description: 'Aprenda a costurar diferentes tipos de bolsos em uniformes escolares.'
        },
        {
          id: 4,
          title: 'Montagem de Camisas',
          duration: '75 min',
          videoUrl: 'https://cdn.wira.training/costura-mod4.mp4',
          downloadable: true,
          description: 'Técnica completa de montagem de camisas escolares passo a passo.'
        },
        {
          id: 5,
          title: 'Acabamentos Profissionais',
          duration: '40 min',
          videoUrl: 'https://cdn.wira.training/costura-mod5.mp4',
          downloadable: true,
          description: 'Acabamentos profissionais que elevam a qualidade dos uniformes escolares.'
        },
        {
          id: 6,
          title: 'Controle de Qualidade',
          duration: '30 min',
          videoUrl: 'https://cdn.wira.training/costura-mod6.mp4',
          downloadable: true,
          description: 'Sistema de controle de qualidade para produção em massa de uniformes.'
        },
        {
          id: 7,
          title: 'Produtividade e Prazos',
          duration: '35 min',
          videoUrl: 'https://cdn.wira.training/costura-mod7.mp4',
          downloadable: true,
          description: 'Técnicas para aumentar produtividade e cumprir prazos de entrega.'
        },
        {
          id: 8,
          title: 'Avaliação Final',
          duration: '60 min',
          videoUrl: 'https://cdn.wira.training/costura-mod8.mp4',
          downloadable: true,
          description: 'Avaliação prática final do curso de costura avançada.'
        }
      ],
      culinaria: [
        {
          id: 1,
          title: 'Técnicas de Corte',
          duration: '40 min',
          videoUrl: 'https://cdn.wira.training/culinaria-mod1.mp4',
          downloadable: true,
          description: 'Técnicas profissionais de corte de alimentos para cozinha moçambicana.'
        },
        {
          id: 2,
          title: 'Cozinha Moçambicana',
          duration: '50 min',
          videoUrl: 'https://cdn.wira.training/culinaria-mod2.mp4',
          downloadable: true,
          description: 'Pratos tradicionais moçambicanos e técnicas de preparo.'
        },
        {
          id: 3,
          title: 'Segurança Alimentar',
          duration: '45 min',
          videoUrl: 'https://cdn.wira.training/culinaria-mod3.mp4',
          downloadable: true,
          description: 'Normas de segurança e higiene na manipulação de alimentos.'
        },
        {
          id: 4,
          title: 'Apresentação',
          duration: '30 min',
          videoUrl: 'https://cdn.wira.training/culinaria-mod4.mp4',
          downloadable: true,
          description: 'Técnicas de apresentação e embelezamento de pratos.'
        },
        {
          id: 5,
          title: 'Cardápios Escolares',
          duration: '55 min',
          videoUrl: 'https://cdn.wira.training/culinaria-mod5.mp4',
          downloadable: true,
          description: 'Planejamento e execução de cardápios para escolas.'
        },
        {
          id: 6,
          title: 'Custo-Benefício',
          duration: '35 min',
          videoUrl: 'https://cdn.wira.training/culinaria-mod6.mp4',
          downloadable: true,
          description: 'Gestão de custos e otimização de ingredientes.'
        },
        {
          id: 7,
          title: 'Avaliação Final',
          duration: '50 min',
          videoUrl: 'https://cdn.wira.training/culinaria-mod7.mp4',
          downloadable: true,
          description: 'Avaliação prática final do curso de culinária profissional.'
        }
      ],
      agricultura: [
        {
          id: 1,
          title: 'Preparação do Solo',
          duration: '35 min',
          videoUrl: 'https://cdn.wira.training/agricultura-mod1.mp4',
          downloadable: true,
          description: 'Técnicas de preparação e conservação do solo para agricultura sustentável.'
        },
        {
          id: 2,
          title: 'Plantio',
          duration: '40 min',
          videoUrl: 'https://cdn.wira.training/agricultura-mod2.mp4',
          downloadable: true,
          description: 'Técnicas de plantio de milho e hortaliças adaptadas ao clima moçambicano.'
        },
        {
          id: 3,
          title: 'Irrigação',
          duration: '45 min',
          videoUrl: 'https://cdn.wira.training/agricultura-mod3.mp4',
          downloadable: true,
          description: 'Sistemas de irrigação eficientes e econômicos para pequenos agricultores.'
        },
        {
          id: 4,
          title: 'Controle de Pragas',
          duration: '30 min',
          videoUrl: 'https://cdn.wira.training/agricultura-mod4.mp4',
          downloadable: true,
          description: 'Métodos orgânicos de controle de pragas e doenças.'
        },
        {
          id: 5,
          title: 'Colheita',
          duration: '35 min',
          videoUrl: 'https://cdn.wira.training/agricultura-mod5.mp4',
          downloadable: true,
          description: 'Técnicas adequadas de colheita e pós-colheita.'
        },
        {
          id: 6,
          title: 'Armazenamento',
          duration: '30 min',
          videoUrl: 'https://cdn.wira.training/agricultura-mod6.mp4',
          downloadable: true,
          description: 'Métodos de armazenamento que preservam a qualidade dos alimentos.'
        }
      ]
    };

    return modules[courseId] || [];
  }

  static async findQuizByCourseId(courseId: string): Promise<QuizQuestion[]> {
    const quizData: Record<string, QuizQuestion[]> = {
      costura: [
        {
          id: 1,
          question: 'Qual é o primeiro passo ao costurar um bolso?',
          options: [
            'Cortar o tecido',
            'Preparar o acabamento das bordas',
            'Costurar diretamente na peça',
            'Medir e marcar a posição'
          ],
          correctAnswer: 3,
          explanation: 'Antes de costurar, é essencial medir e marcar a posição exata do bolso na peça para garantir alinhamento.'
        },
        {
          id: 2,
          question: 'Qual máquina industrial é mais adequada para produção de uniformes escolares?',
          options: [
            'Máquina reta',
            'Máquina overlock',
            'Máquina zig-zag',
            'Máquina industrial plana'
          ],
          correctAnswer: 3,
          explanation: 'Máquinas industriais planas são ideais para produção em massa de uniformes, pois oferecem maior velocidade e consistência.'
        },
        {
          id: 3,
          question: 'Qual é a função da agulha dupla em uma máquina industrial?',
          options: [
            'Criar pontos decorativos',
            'Fazer costura reforçada',
            'Costurar duas camadas de tecido simultaneamente',
            'Permitir costura mais rápida em tecidos espessos'
          ],
          correctAnswer: 3,
          explanation: 'A agulha dupla permite costurar duas camadas simultaneamente, aumentando a produtividade em tecidos espessos.'
        }
      ],
      culinaria: [
        {
          id: 1,
          question: 'Qual é a temperatura segura para armazenar alimentos?',
          options: [
            'Abaixo de 5°C',
            'Entre 5°C e 60°C',
            'Acima de 60°C',
            'Não importa'
          ],
          correctAnswer: 1,
          explanation: 'A zona de temperatura segura para armazenamento de alimentos é abaixo de 5°C para evitar proliferação bacteriana.'
        },
        {
          id: 2,
          question: 'Qual é o tempo mínimo para cozimento seguro de carnes?',
          options: [
            '30 minutos',
            'Depende da temperatura interna',
            'Até dourar por fora',
            '10 minutos em fogo alto'
          ],
          correctAnswer: 2,
          explanation: 'O cozimento seguro depende da temperatura interna alcançada, não apenas do tempo.'
        }
      ],
      agricultura: [
        {
          id: 1,
          question: 'Qual é o melhor período para plantar milho em Moçambique?',
          options: [
            'Janeiro a Fevereiro',
            'Março a Abril',
            'Setembro a Outubro',
            'Novembro a Dezembro'
          ],
          correctAnswer: 2,
          explanation: 'O período de chuvas em Moçambique vai de novembro a abril, tornando setembro a outubro o período ideal para plantio.'
        },
        {
          id: 2,
          question: 'Qual é o pH ideal para a maioria das hortaliças?',
          options: [
            '4.0 - 5.0',
            '5.5 - 6.5',
            '6.0 - 7.0',
            '7.0 - 8.0'
          ],
          correctAnswer: 3,
          explanation: 'A maioria das hortaliças cresce melhor em solo com pH entre 6.0 e 7.0, levemente ácido a neutro.'
        }
      ]
    };

    return quizData[courseId] || [];
  }

  // New ORM-like methods
  static async findUnique(where: { id: string }): Promise<CourseInterface | null> {
    return await this.findById(where.id);
  }

  static async findMany(): Promise<CourseInterface[]> {
    return await this.findAll();
  }

  static async create(data: Omit<CourseInterface, 'id' | 'created_at' | 'updated_at'>): Promise<CourseInterface> {
    try {
      const course = await prisma.course.create({
        data: {
          id: `course-${Date.now()}`,
          title: data.title,
          description: data.description || null,
          instructor: data.instructor || null,
          duration_hours: data.duration_hours,
          modules_count: data.modules_count,
          level: data.level,
          skills: data.skills || null,
          is_active: data.is_active ?? true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return {
        ...course,
        created_at: course.created_at.toISOString(),
        updated_at: course.updated_at?.toISOString()
      } as CourseInterface;
    } catch (error) {
      throw error;
    }
  }

  static async update(
    where: { id: string },
    data: Partial<Omit<CourseInterface, 'id' | 'created_at'>>
  ): Promise<CourseInterface | null> {
    try {
      const updates: any = { ...data };
      updates.updated_at = new Date();

      const course = await prisma.course.update({
        where,
        data: updates
      });

      return {
        ...course,
        created_at: course.created_at.toISOString(),
        updated_at: course.updated_at?.toISOString()
      } as CourseInterface;
    } catch (error) {
      throw error;
    }
  }

  static async delete(where: { id: string }): Promise<void> {
    try {
      await prisma.course.delete({
        where
      });
    } catch (error) {
      throw error;
    }
  }
}

export default CourseModel;
