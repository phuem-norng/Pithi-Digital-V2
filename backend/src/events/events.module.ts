import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventSlugService } from './event-slug.service';

/**
 * Events Module
 * Provides event management functionality
 */
@Module({
  imports: [PrismaModule],
  providers: [EventsService, EventSlugService],
  controllers: [EventsController],
  exports: [EventsService, EventSlugService],
})
export class EventsModule {}
