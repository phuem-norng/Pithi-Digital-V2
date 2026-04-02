import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGiftDto, UpdateGiftDto } from '../common/dtos';

@Injectable()
export class GiftsService {
  constructor(private prisma: PrismaService) {}

  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'ADMIN';
  }

  private async ensureEventAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, userId: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const canManageEvent = event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot manage gifts for this event');
    }

    return event;
  }

  private async ensureGuestInEvent(guestId: string, eventId: string) {
    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, eventId },
      select: { id: true },
    });

    if (!guest) {
      throw new BadRequestException('Guest does not belong to this event');
    }
  }

  async create(eventId: string, userId: string, dto: CreateGiftDto) {
    await this.ensureEventAccess(eventId, userId);
    await this.ensureGuestInEvent(dto.guestId, eventId);

    const existing = await this.prisma.gift.findFirst({
      where: {
        eventId,
        guestId: dto.guestId,
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Guest already has a gift record');
    }

    return this.prisma.gift.create({
      data: {
        eventId,
        guestId: dto.guestId,
        paymentType: dto.paymentType,
        currencyType: dto.currencyType,
        amount: Number(dto.amount),
        note: dto.note?.trim() || null,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async findByEvent(eventId: string, userId: string) {
    await this.ensureEventAccess(eventId, userId);

    return this.prisma.gift.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateGiftDto) {
    const existing = await this.prisma.gift.findUnique({
      where: { id },
      include: {
        event: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Gift with ID ${id} not found`);
    }

    const canManageEvent = existing.event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot update gift from this event');
    }

    const nextGuestId = dto.guestId || existing.guestId;

    if (dto.guestId) {
      await this.ensureGuestInEvent(dto.guestId, existing.eventId);
    }

    const duplicate = await this.prisma.gift.findFirst({
      where: {
        eventId: existing.eventId,
        guestId: nextGuestId,
        id: { not: id },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new BadRequestException('Guest already has a gift record');
    }

    return this.prisma.gift.update({
      where: { id },
      data: {
        guestId: nextGuestId,
        paymentType: dto.paymentType || existing.paymentType,
        currencyType: dto.currencyType || existing.currencyType,
        amount: typeof dto.amount === 'number' ? Number(dto.amount) : existing.amount,
        note: typeof dto.note === 'string' ? dto.note.trim() || null : existing.note,
      },
      include: {
        guest: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    const existing = await this.prisma.gift.findUnique({
      where: { id },
      include: {
        event: {
          select: { userId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Gift with ID ${id} not found`);
    }

    const canManageEvent = existing.event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot delete gift from this event');
    }

    return this.prisma.gift.delete({ where: { id } });
  }
}
