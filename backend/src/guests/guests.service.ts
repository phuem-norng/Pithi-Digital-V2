import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto, UpdateGuestDto, UpdateGuestStatusDto } from '../common/dtos';

@Injectable()
export class GuestsService {
  constructor(private prisma: PrismaService) {}

  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'ADMIN';
  }

  private normalizeGuestName(name: string) {
    return name.trim().toLowerCase();
  }

  private shouldPreventDuplicateGuestNames(metadata: unknown): boolean {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return false;
    }

    const value = (metadata as Record<string, unknown>).preventDuplicateGuestNames;
    return value === true;
  }

  private async ensureGuestNameAllowed(eventId: string, guestName: string, metadata?: unknown) {
    if (!this.shouldPreventDuplicateGuestNames(metadata)) {
      return;
    }

    const normalizedTargetName = this.normalizeGuestName(guestName);

    const existingGuests = await this.prisma.guest.findMany({
      where: { eventId },
      select: { name: true },
    });

    const hasDuplicate = existingGuests.some(
      (guest) => this.normalizeGuestName(guest.name) === normalizedTargetName,
    );

    if (hasDuplicate) {
      throw new BadRequestException('Guest name already exists for this event');
    }
  }

  async create(eventId: string, userId: string, createGuestDto: CreateGuestDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const canManageEvent = event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot add guests to this event');
    }

    await this.ensureGuestNameAllowed(eventId, createGuestDto.name, event.metadata);

    return this.prisma.guest.create({
      data: {
        eventId,
        name: createGuestDto.name,
        phone: createGuestDto.phone,
        group: createGuestDto.group || 'GROOM_SIDE',
        tag: createGuestDto.tag || 'OTHERS',
        greetingMessage: createGuestDto.greetingMessage,
        note: createGuestDto.note,
        tableNumber: createGuestDto.tableNumber,
        adultCount: Number(createGuestDto.adultCount || 0),
        childrenCount: Number(createGuestDto.childrenCount || 0),
      },
    });
  }

  async findByEvent(eventId: string, skip = 0, take = 50) {
    return this.prisma.guest.findMany({
      where: { eventId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(guestId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
      include: {
        event: true,
      },
    });

    if (!guest) {
      throw new NotFoundException(`Guest with ID ${guestId} not found`);
    }

    return guest;
  }

  async updateStatus(guestId: string, updateStatusDto: UpdateGuestStatusDto) {
    await this.findById(guestId);

    const statusMap: Record<string, 'PENDING' | 'CONFIRMED' | 'DECLINED'> = {
      PENDING: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      ACCEPTED: 'CONFIRMED',
      DECLINED: 'DECLINED',
    };

    const nextStatus = statusMap[updateStatusDto.status];
    if (!nextStatus) {
      throw new BadRequestException('Invalid RSVP status');
    }

    const updated = await this.prisma.guest.update({
      where: { id: guestId },
      data: {
        rsvpStatus: nextStatus,
      },
      include: {
        event: true,
      },
    });

    await this.recalculateGuestCount(updated.eventId);

    return updated;
  }

  async update(guestId: string, userId: string, updateGuestDto: UpdateGuestDto) {
    const guest = await this.findById(guestId);

    const canManageEvent = guest.event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot update guests from this event');
    }

    const nextName = updateGuestDto.name?.trim();
    if (nextName && this.normalizeGuestName(nextName) !== this.normalizeGuestName(guest.name)) {
      await this.ensureGuestNameAllowed(guest.eventId, nextName, guest.event.metadata);
    }

    const updated = await this.prisma.guest.update({
      where: { id: guestId },
      data: {
        name: nextName || guest.name,
        phone: updateGuestDto.phone,
        group:
          typeof updateGuestDto.group === 'string'
            ? updateGuestDto.group
            : guest.group,
        tag:
          typeof updateGuestDto.tag === 'string'
            ? updateGuestDto.tag
            : guest.tag,
        greetingMessage:
          typeof updateGuestDto.greetingMessage === 'string'
            ? updateGuestDto.greetingMessage
            : guest.greetingMessage,
        note:
          typeof updateGuestDto.note === 'string'
            ? updateGuestDto.note
            : guest.note,
        adultCount:
          typeof updateGuestDto.adultCount === 'number'
            ? Number(updateGuestDto.adultCount)
            : guest.adultCount,
        childrenCount:
          typeof updateGuestDto.childrenCount === 'number'
            ? Number(updateGuestDto.childrenCount)
            : guest.childrenCount,
      },
    });

    return updated;
  }

  async delete(guestId: string, userId: string) {
    const guest = await this.findById(guestId);

    const canManageEvent = guest.event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot delete guests from this event');
    }

    const deleted = await this.prisma.guest.delete({
      where: { id: guestId },
    });

    await this.recalculateGuestCount(guest.eventId);

    return deleted;
  }

  async submitPublicRsvpBySlug(
    slug: string,
    payload: {
      name: string;
      phone?: string;
      guestId?: string;
      rsvpStatus: 'PENDING' | 'CONFIRMED' | 'DECLINED';
      adultCount?: number;
      childrenCount?: number;
      greetingMessage?: string;
    },
  ) {
    const normalizedName = payload.name?.trim();
    const normalizedPhone = payload.phone?.trim();

    const event = await this.prisma.event.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (payload.guestId) {
      const existingGuest = await this.prisma.guest.findFirst({
        where: {
          id: payload.guestId,
          eventId: event.id,
        },
      });

      if (!existingGuest) {
        throw new NotFoundException('Invited guest not found for this event');
      }

      const updatedGuest = await this.prisma.guest.update({
        where: { id: existingGuest.id },
        data: {
          phone: payload.phone ?? existingGuest.phone,
          rsvpStatus: payload.rsvpStatus,
          adultCount: Number(payload.adultCount ?? existingGuest.adultCount ?? 0),
          childrenCount: Number(payload.childrenCount ?? existingGuest.childrenCount ?? 0),
          greetingMessage:
            typeof payload.greetingMessage === 'string'
              ? payload.greetingMessage.trim()
              : existingGuest.greetingMessage,
        },
      });

      await this.recalculateGuestCount(event.id);
      return updatedGuest;
    }

    let matchedGuest: { id: string; adultCount: number | null; childrenCount: number | null; greetingMessage: string | null } | null = null;

    if (normalizedPhone) {
      matchedGuest = await this.prisma.guest.findFirst({
        where: {
          eventId: event.id,
          phone: normalizedPhone,
        },
        select: {
          id: true,
          adultCount: true,
          childrenCount: true,
          greetingMessage: true,
        },
      });
    }

    if (!matchedGuest && normalizedName) {
      matchedGuest = await this.prisma.guest.findFirst({
        where: {
          eventId: event.id,
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          adultCount: true,
          childrenCount: true,
          greetingMessage: true,
        },
      });
    }

    if (matchedGuest) {
      const updatedGuest = await this.prisma.guest.update({
        where: { id: matchedGuest.id },
        data: {
          phone: normalizedPhone ?? undefined,
          rsvpStatus: payload.rsvpStatus,
          adultCount: Number(payload.adultCount ?? matchedGuest.adultCount ?? 0),
          childrenCount: Number(payload.childrenCount ?? matchedGuest.childrenCount ?? 0),
          greetingMessage:
            typeof payload.greetingMessage === 'string'
              ? payload.greetingMessage.trim()
              : matchedGuest.greetingMessage,
        },
      });

      await this.recalculateGuestCount(event.id);
      return updatedGuest;
    }

    const fullEvent = await this.prisma.event.findUnique({
      where: { id: event.id },
      select: { metadata: true },
    });

    await this.ensureGuestNameAllowed(event.id, normalizedName || payload.name, fullEvent?.metadata);

    const guest = await this.prisma.guest.create({
      data: {
        eventId: event.id,
        name: normalizedName || payload.name,
        phone: normalizedPhone,
        rsvpStatus: payload.rsvpStatus,
        adultCount: Number(payload.adultCount || 0),
        childrenCount: Number(payload.childrenCount || 0),
        greetingMessage: payload.greetingMessage?.trim() || undefined,
      },
    });

    await this.recalculateGuestCount(event.id);

    return guest;
  }

  async findPublicGuestBySlug(slug: string, guestId: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug },
      select: { id: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const guest = await this.prisma.guest.findFirst({
      where: {
        id: guestId,
        eventId: event.id,
      },
      select: {
        id: true,
        eventId: true,
        name: true,
        phone: true,
        rsvpStatus: true,
        adultCount: true,
        childrenCount: true,
        greetingMessage: true,
        updatedAt: true,
      },
    });

    if (!guest) {
      throw new NotFoundException('Invited guest not found for this event');
    }

    return guest;
  }

  private async recalculateGuestCount(eventId: string) {
    const count = await this.prisma.guest.count({
      where: { eventId },
    });

    await this.prisma.event.update({
      where: { id: eventId },
      data: { guestCount: count },
    });
  }
}
