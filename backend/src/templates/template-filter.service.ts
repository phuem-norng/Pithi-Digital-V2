import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemplateFilterService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllTemplates() {
    return this.prisma.template.findMany({
      include: {
        eventType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplatesByEventType(eventTypeId: string) {
    return this.prisma.template.findMany({
      where: { eventTypeId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
