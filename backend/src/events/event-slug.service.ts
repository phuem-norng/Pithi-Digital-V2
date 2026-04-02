import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildEventSlugBase } from '../common/utils/slug.util';

@Injectable()
export class EventSlugService {
  constructor(private readonly prisma: PrismaService) {}

  async generateUniqueSlug(title: string, date?: Date): Promise<string> {
    const base = buildEventSlugBase(title, date);
    let candidate = base;
    let sequence = 1;

    while (true) {
      const found = await this.prisma.event.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!found) {
        return candidate;
      }

      candidate = `${base}-${sequence}`;
      sequence += 1;
    }
  }
}
