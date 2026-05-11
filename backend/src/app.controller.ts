import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Liveness + quick DB ping (does not replace monitoring, but helps debug 503/500 from Prisma).
   */
  @Get('api/health')
  async health(): Promise<{
    status: string;
    database?: 'ok' | 'error';
    databaseError?: string;
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok' };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      return {
        status: 'ok',
        database: 'error',
        databaseError: message,
      };
    }
  }
}
