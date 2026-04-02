import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.eventType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const eventType = await this.prisma.eventType.findUnique({
      where: { slug },
    });

    if (!eventType) {
      throw new NotFoundException('Event type not found');
    }

    return eventType;
  }
}
