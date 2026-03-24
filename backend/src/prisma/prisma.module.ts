import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma Module
 * Provides Prisma service as a singleton across the application
 */
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
