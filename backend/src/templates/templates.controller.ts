import { Controller, Get, Query } from '@nestjs/common';
import { TemplateFilterService } from './template-filter.service';

@Controller('api/templates')
export class TemplatesController {
  constructor(private readonly templateFilterService: TemplateFilterService) {}

  @Get()
  async findAll(@Query('eventTypeId') eventTypeId?: string) {
    if (eventTypeId) {
      return this.templateFilterService.getTemplatesByEventType(eventTypeId);
    }

    return this.templateFilterService.getAllTemplates();
  }
}
