import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from '../common/dtos';

/**
 * Events Service
 * Handles event CRUD operations
 */
@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new event for the authenticated user
   */
  async create(userId: string, createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...createEventDto,
        date: new Date(createEventDto.date),
        userId,
      },
      include: {
        guests: true,
      },
    });
  }

  /**
   * Get all events for the authenticated user
   */
  async findByUser(userId: string, skip = 0, take = 10) {
    return this.prisma.event.findMany({
      where: { userId },
      skip,
      take,
      include: {
        guests: true,
        invitations: true,
        _count: {
          select: { guests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single event by ID
   */
  async findById(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        guests: true,
        invitations: true,
        templates: true,
        _count: {
          select: { 
            guests: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event;
  }

  /**
   * Update an event (owner only)
   */
  async update(
    eventId: string,
    userId: string,
    updateEventDto: UpdateEventDto,
  ) {
    const event = await this.findById(eventId);

    if (event.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this event',
      );
    }

    return this.prisma.event.update({
      where: { id: eventId },
      data: updateEventDto,
      include: {
        guests: true,
      },
    });
  }

  /**
   * Delete an event (owner only)
   */
  async delete(eventId: string, userId: string) {
    const event = await this.findById(eventId);

    if (event.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this event',
      );
    }

    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  /**
   * Get event statistics
   */
  async getStats(eventId: string, userId: string) {
    const event = await this.findById(eventId);

    if (event.userId !== userId) {
      throw new ForbiddenException('Cannot access stats for this event');
    }

    const guests = await this.prisma.guest.groupBy({
      by: ['status'],
      where: { eventId },
      _count: true,
    });

    const stats = {
      totalGuests: 0,
      accepted: 0,
      declined: 0,
      pending: 0,
    };

    guests.forEach((group) => {
      stats.totalGuests += group._count;
      if (group.status === 'ACCEPTED') stats.accepted = group._count;
      if (group.status === 'DECLINED') stats.declined = group._count;
      if (group.status === 'PENDING') stats.pending = group._count;
    });

    return stats;
  }
}
