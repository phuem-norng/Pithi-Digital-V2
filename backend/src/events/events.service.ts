import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from '../common/dtos';
import { EventSlugService } from './event-slug.service';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private eventSlugService: EventSlugService,
  ) {}

  async create(userId: string, createEventDto: CreateEventDto) {
    let eventTypeId = createEventDto.eventTypeId;
    let templateId = createEventDto.templateId;

    if (!eventTypeId) {
      const fallbackType = await this.prisma.eventType.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      eventTypeId = fallbackType?.id;
    }

    if (!templateId && eventTypeId) {
      const fallbackTemplate = await this.prisma.template.findFirst({
        where: { eventTypeId },
        orderBy: { createdAt: 'asc' },
      });
      templateId = fallbackTemplate?.id;
    }

    if (eventTypeId && templateId) {
      const template = await this.prisma.template.findUnique({
        where: { id: templateId },
        select: { eventTypeId: true },
      });

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      if (template.eventTypeId !== eventTypeId) {
        throw new BadRequestException(
          'Template is not compatible with selected event type',
        );
      }
    }

    const eventDate = new Date(createEventDto.date);
    const slug = createEventDto.slug?.trim()
      ? await this.eventSlugService.generateUniqueSlug(createEventDto.slug, eventDate)
      : await this.eventSlugService.generateUniqueSlug(createEventDto.title, eventDate);
    const normalizedMetadata = await this.normalizeEventMetadata(
      createEventDto.metadata,
      eventTypeId,
      createEventDto.type,
    );

    const createData: Prisma.EventUncheckedCreateInput = {
      title: createEventDto.title,
      description: createEventDto.description,
      type: this.normalizeEventType(createEventDto.type) as any,
      slug,
      date: eventDate,
      location: createEventDto.location,
      address: createEventDto.address || createEventDto.location,
      googleMapLink: createEventDto.googleMapLink,
      coordinates: createEventDto.coordinates as Prisma.InputJsonValue | undefined,
      musicUrl: createEventDto.musicUrl,
      coverImage: createEventDto.coverImage,
      khqrDollar: createEventDto.khqrDollar,
      khqrRiel: createEventDto.khqrRiel,
      metadata: normalizedMetadata,
      userId,
      eventTypeId,
      templateId,
    };

    const createdEvent = await this.prisma.event.create({
      data: createData,
      include: {
        eventType: true,
        template: true,
        guests: true,
      },
    });

    await this.syncGalleryImagesTable(
      createdEvent.id,
      this.getMetadataObject(normalizedMetadata),
    );

    return createdEvent;
  }

  async findByUser(userId: string, skip = 0, take = 10) {
    return this.withPrismaPoolRetry(() =>
      this.prisma.event.findMany({
        where: { userId },
        skip,
        take,
        include: {
          guests: true,
          eventType: true,
          template: true,
          _count: {
            select: { guests: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  async findById(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        guests: true,
        eventType: true,
        template: true,
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

  async findPublicBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        date: true,
        location: true,
        address: true,
        googleMapLink: true,
        coordinates: true,
        musicUrl: true,
        coverImage: true,
        khqrDollar: true,
        khqrRiel: true,
        metadata: true,
        guestCount: true,
        eventType: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            description: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            previewUrl: true,
            config: true,
          },
        },
        createdAt: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with slug ${slug} not found`);
    }

    return event;
  }

  async findPublicById(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        slug: true,
        date: true,
        location: true,
        address: true,
        googleMapLink: true,
        coordinates: true,
        musicUrl: true,
        coverImage: true,
        khqrDollar: true,
        khqrRiel: true,
        metadata: true,
        guestCount: true,
        eventType: true,
        template: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    return event;
  }

  async update(eventId: string, userId: string, updateEventDto: UpdateEventDto) {
    const event = await this.findById(eventId);

    if (event.userId !== userId) {
      throw new ForbiddenException('You do not have permission to update this event');
    }

    let slug = updateEventDto.slug;
    if (updateEventDto.title && !updateEventDto.slug) {
      slug = await this.eventSlugService.generateUniqueSlug(
        updateEventDto.title,
        updateEventDto.date ? new Date(updateEventDto.date) : undefined,
      );
    }

    const nextEventTypeId =
      updateEventDto.eventTypeId !== undefined
        ? updateEventDto.eventTypeId
        : event.eventTypeId || undefined;
    const metadataSource =
      updateEventDto.metadata !== undefined
        ? updateEventDto.metadata
        : this.getMetadataObject(event.metadata);
    const shouldNormalizeMetadata =
      updateEventDto.metadata !== undefined ||
      updateEventDto.eventTypeId !== undefined ||
      updateEventDto.type !== undefined;
    const normalizedMetadata = shouldNormalizeMetadata
      ? await this.normalizeEventMetadata(
          metadataSource,
          nextEventTypeId,
          updateEventDto.type || event.type || undefined,
        )
      : undefined;

    const updateData: Prisma.EventUncheckedUpdateInput = {
      ...(updateEventDto.title !== undefined ? { title: updateEventDto.title } : {}),
      ...(updateEventDto.description !== undefined ? { description: updateEventDto.description } : {}),
      ...(updateEventDto.type !== undefined
        ? { type: this.normalizeEventType(updateEventDto.type) as any }
        : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(updateEventDto.date ? { date: new Date(updateEventDto.date) } : {}),
      ...(updateEventDto.location !== undefined ? { location: updateEventDto.location } : {}),
      ...(updateEventDto.address !== undefined ? { address: updateEventDto.address } : {}),
      ...(updateEventDto.googleMapLink !== undefined ? { googleMapLink: updateEventDto.googleMapLink } : {}),
      ...(updateEventDto.coordinates !== undefined
        ? { coordinates: updateEventDto.coordinates as Prisma.InputJsonValue }
        : {}),
      ...(updateEventDto.musicUrl !== undefined ? { musicUrl: updateEventDto.musicUrl } : {}),
      ...(updateEventDto.coverImage !== undefined ? { coverImage: updateEventDto.coverImage } : {}),
      ...(updateEventDto.khqrDollar !== undefined ? { khqrDollar: updateEventDto.khqrDollar } : {}),
      ...(updateEventDto.khqrRiel !== undefined ? { khqrRiel: updateEventDto.khqrRiel } : {}),
      ...(normalizedMetadata !== undefined ? { metadata: normalizedMetadata } : {}),
      ...(updateEventDto.eventTypeId !== undefined ? { eventTypeId: updateEventDto.eventTypeId } : {}),
      ...(updateEventDto.templateId !== undefined ? { templateId: updateEventDto.templateId } : {}),
    };

    const updatedEvent = await this.prisma.event.update({
      where: { id: eventId },
      data: updateData,
      include: {
        guests: true,
        eventType: true,
        template: true,
      },
    });

    if (normalizedMetadata !== undefined) {
      await this.syncGalleryImagesTable(
        updatedEvent.id,
        this.getMetadataObject(normalizedMetadata),
      );
    }

    return updatedEvent;
  }

  async delete(eventId: string, userId: string) {
    const event = await this.findById(eventId);

    if (event.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this event');
    }

    return this.prisma.event.delete({
      where: { id: eventId },
    });
  }

  async getStats(eventId: string, userId: string) {
    const event = await this.findById(eventId);

    if (event.userId !== userId) {
      throw new ForbiddenException('Cannot access stats for this event');
    }

    const guests = await this.prisma.guest.groupBy({
      by: ['rsvpStatus'],
      where: { eventId },
      _count: true,
    });

    const stats = {
      totalGuests: 0,
      confirmed: 0,
      declined: 0,
      pending: 0,
    };

    guests.forEach((group) => {
      stats.totalGuests += group._count;
      if (group.rsvpStatus === 'CONFIRMED') stats.confirmed = group._count;
      if (group.rsvpStatus === 'DECLINED') stats.declined = group._count;
      if (group.rsvpStatus === 'PENDING') stats.pending = group._count;
    });

    return stats;
  }

  private getMetadataObject(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return { ...(value as Record<string, unknown>) };
  }

  private mapCategoryKeyToKhmerLabel(categoryKey: string): string {
    const labels: Record<string, string> = {
      wedding: 'អាពាហ៍ពិពាហ៍',
      birthday: 'ខួបកំណើត',
      housewarming: 'ឡើងផ្ទះ',
      party: 'ជប់លៀង',
      'money-forest-festival': 'បុណ្យផ្កាប្រាក់',
      memorial: 'បុណ្យសព',
      ceremony: 'បុណ្យទូទៅ',
      other: 'បុណ្យទូទៅ',
    };

    return labels[categoryKey] || 'ព្រឹត្តិការណ៍';
  }

  private normalizeEventType(type: string | null | undefined): string | undefined {
    if (!type) {
      return undefined;
    }

    const normalized = type.toUpperCase();
    const aliases: Record<string, string> = {
      CEREMONY: 'OTHER',
      FUNERAL: 'MEMORIAL',
    };

    const resolved = aliases[normalized] || normalized;
    const allowed = new Set([
      'WEDDING',
      'BIRTHDAY',
      'HOUSEWARMING',
      'MEMORIAL',
      'ENGAGEMENT',
      'GRADUATION',
      'BABY_SHOWER',
      'OTHER',
    ]);

    return allowed.has(resolved) ? resolved : 'OTHER';
  }

  private mapTypeToCategoryKey(type: string | null | undefined): string | undefined {
    const normalized = type?.toUpperCase();
    if (!normalized) {
      return undefined;
    }

    const map: Record<string, string> = {
      WEDDING: 'wedding',
      BIRTHDAY: 'birthday',
      HOUSEWARMING: 'housewarming',
      FUNERAL: 'funeral',
      MEMORIAL: 'funeral',
      CEREMONY: 'ceremony',
      OTHER: 'other',
      ENGAGEMENT: 'ceremony',
      GRADUATION: 'ceremony',
      BABY_SHOWER: 'ceremony',
    };

    return map[normalized];
  }

  private async resolveCategoryFromEventType(
    eventTypeId: string | undefined,
    fallbackType: string | null | undefined,
  ): Promise<{ categoryKey?: string; category?: string }> {
    if (eventTypeId) {
      const eventType = await this.prisma.eventType.findUnique({
        where: { id: eventTypeId },
        select: { slug: true, name: true },
      });

      if (eventType) {
        const categoryKey = eventType.slug || this.mapTypeToCategoryKey(fallbackType);
        const category = categoryKey
          ? this.mapCategoryKeyToKhmerLabel(categoryKey)
          : eventType.name || 'ព្រឹត្តិការណ៍';

        return { categoryKey, category };
      }
    }

    const fallbackKey = this.mapTypeToCategoryKey(fallbackType);
    if (!fallbackKey) {
      return {};
    }

    return {
      categoryKey: fallbackKey,
      category: this.mapCategoryKeyToKhmerLabel(fallbackKey),
    };
  }

  private async normalizeEventMetadata(
    metadata: Record<string, unknown> | undefined,
    eventTypeId: string | undefined,
    fallbackType: string | null | undefined,
  ): Promise<Prisma.InputJsonValue | undefined> {
    const normalized = this.getMetadataObject(metadata) || {};

    const hasCategory =
      typeof normalized.category === 'string' && normalized.category.trim().length > 0;
    const hasCategoryKey =
      typeof normalized.categoryKey === 'string' && normalized.categoryKey.trim().length > 0;

    if (!hasCategory || !hasCategoryKey) {
      const resolved = await this.resolveCategoryFromEventType(eventTypeId, fallbackType);

      if (!hasCategoryKey && resolved.categoryKey) {
        normalized.categoryKey = resolved.categoryKey;
      }

      if (!hasCategory && resolved.category) {
        normalized.category = resolved.category;
      }
    }

    return Object.keys(normalized).length
      ? (normalized as Prisma.InputJsonValue)
      : undefined;
  }

  private extractGalleryImageUrls(metadata: Record<string, unknown> | undefined): string[] {
    if (!metadata) {
      return [];
    }

    const candidates = [
      metadata.galleryImages,
      metadata.uploadedImages,
      metadata.images,
    ];

    const urls = candidates
      .flatMap((entry) => (Array.isArray(entry) ? entry : []))
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
      .map((entry) => entry.trim());

    return [...new Set(urls)];
  }

  private async syncGalleryImagesTable(
    eventId: string,
    metadata: Record<string, unknown> | undefined,
  ): Promise<void> {
    const urls = this.extractGalleryImageUrls(metadata);

    await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        DELETE FROM "event_gallery_images"
        WHERE "event_id" = ${eventId}
      `;

      for (let index = 0; index < urls.length; index += 1) {
        await tx.$executeRaw`
          INSERT INTO "event_gallery_images" ("event_id", "image_url", "display_order", "updated_at")
          VALUES (${eventId}, ${urls[index]}, ${index}, NOW())
        `;
      }
    });
  }

  private async withPrismaPoolRetry<T>(
    operation: () => Promise<T>,
    retries = 2,
    delayMs = 250,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const code =
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code
            : undefined;

        if (code !== 'P2024' || attempt === retries) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }

    throw lastError;
  }
}
