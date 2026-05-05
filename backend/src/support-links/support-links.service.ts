import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CreateSupportLinkInput = {
  label: string;
  url: string;
  platform?: string;
  isActive?: boolean;
  sortOrder?: number;
};

type UpdateSupportLinkInput = {
  label?: string;
  url?: string;
  platform?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

@Injectable()
export class SupportLinksService {
  constructor(private prisma: PrismaService) {}

  async findPublic() {
    return this.prisma.supportLink.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findAll() {
    return this.prisma.supportLink.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(input: CreateSupportLinkInput) {
    return this.prisma.supportLink.create({
      data: {
        label: input.label.trim(),
        url: input.url.trim(),
        platform: input.platform?.trim() || null,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, input: UpdateSupportLinkInput) {
    await this.findOne(id);
    return this.prisma.supportLink.update({
      where: { id },
      data: {
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.url !== undefined ? { url: input.url.trim() } : {}),
        ...(input.platform !== undefined ? { platform: input.platform?.trim() || null } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.supportLink.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const link = await this.prisma.supportLink.findUnique({ where: { id } });
    if (!link) {
      throw new NotFoundException(`Support link ${id} not found`);
    }
    return link;
  }
}
