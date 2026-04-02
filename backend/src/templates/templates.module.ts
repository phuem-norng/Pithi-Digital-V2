import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TemplateFilterService } from './template-filter.service';
import { TemplatesController } from './templates.controller';

@Module({
  imports: [PrismaModule],
  providers: [TemplateFilterService],
  controllers: [TemplatesController],
  exports: [TemplateFilterService],
})
export class TemplatesModule {}
