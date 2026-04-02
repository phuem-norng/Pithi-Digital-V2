import { Controller, Get, Param } from '@nestjs/common';
import { EventTypesService } from './event-types.service';

@Controller('api/event-types')
export class EventTypesController {
  constructor(private readonly eventTypesService: EventTypesService) {}

  @Get()
  async findAll() {
    return this.eventTypesService.findAll();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.eventTypesService.findBySlug(slug);
  }
}
