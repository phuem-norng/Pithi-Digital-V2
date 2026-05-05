import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MusicService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.music.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async create(name: string, url: string) {
    return this.prisma.music.create({ data: { name, url } });
  }

  async update(id: string, data: { name?: string; url?: string }) {
    await this.findOne(id);
    return this.prisma.music.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.music.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const music = await this.prisma.music.findUnique({ where: { id } });
    if (!music) throw new NotFoundException(`Music ${id} not found`);
    return music;
  }
}
