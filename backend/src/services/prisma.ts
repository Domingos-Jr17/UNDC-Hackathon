import { PrismaClient } from '@prisma/client';
import winston from 'winston';

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/prisma.log'
    })
  ]
});

class PrismaService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['error', 'warn', 'info']
    });
  }

  getClient(): PrismaClient {
    return this.prisma;
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
    logger.info('Prisma client connected');
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
    logger.info('Prisma client disconnected');
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;

      return { status: 'healthy', latency };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: (error as Error).message
      };
    }
  }
}

// Singleton instance
const prismaService = new PrismaService();

export default prismaService;
export { PrismaService };
