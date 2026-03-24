import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto, UpdateGuestStatusDto } from '../common/dtos';

/**
 * Guests Service
 * Handles guest management and RSVP tracking
 */
@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Add a guest to an event
   */
  async create(eventId: string, userId: string, createGuestDto: CreateGuestDto) {
    // Verify event ownership
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    if (event.userId !== userId) {
      throw new ForbiddenException('Cannot add guests to this event');
    }

    // Check for duplicate phone number in same event
    if (createGuestDto.phone) {
      const existingGuest = await this.prisma.guest.findFirst({
        where: {
          eventId,
          phone: createGuestDto.phone,
        },
      });

      if (existingGuest) {
        throw new BadRequestException(
          'Guest with this phone number already exists in this event',
        );
      }
    }

    return this.prisma.guest.create({
      data: {
        ...createGuestDto,
        eventId,
      },
    });
  }

  /**
   * Get all guests for an event
   */
  async findByEvent(eventId: string, skip = 0, take = 50) {
    return this.prisma.guest.findMany({
      where: { eventId },
      include: {
        invitation: true,
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single guest by ID
   */
  async findById(guestId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        event: true,
        invitation: true,
      },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${guestId} not found`);
    }

    return guest;
  }

  /**
   * Update guest RSVP status (for public invitation page)
   */
  async updateStatus(guestId: string, updateStatusDto: UpdateGuestStatusDto) {
    const guest = await this.findById(guestId);

    return this.prisma.guest.update({
      where: { id: guestId },
      data: {
        status: updateStatusDto.status,
      },
      include: {
        event: true,
      },
    });
  }

  /**
   * Delete a guest from an event
   */
  async delete(guestId: string, userId: string) {
    const guest = await this.findById(guestId);

    // Verify event ownership
    if (guest.event.userId !== userId) {
      throw new ForbiddenException('Cannot delete guests from this event');
    }

    return this.prisma.guest.delete({
      where: { id: guestId },
    });
  }

  /**
   * Get guest by invitation link (for public RSVP)
   */
  async findByInvitationLink(uniqueLink: string) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { uniqueLink },
      include: {
        guest: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation link');
    }

    return invitation;
  }
}
