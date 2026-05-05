import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { SupportLinksController } from './support-links.controller';
import { SupportLinksService } from './support-links.service';

@Module({
  imports: [PrismaModule, UsersModule],
  controllers: [SupportLinksController],
  providers: [SupportLinksService],
})
export class SupportLinksModule {}
