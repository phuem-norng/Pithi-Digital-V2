import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MusicService } from './music.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import type { JwtPayload } from '../common/interfaces';

@Controller('api/music')
export class MusicController {
  constructor(
    private musicService: MusicService,
    private usersService: UsersService,
  ) {}

  /** GET /api/music — public, used by invitation builder */
  @Get()
  findAll() {
    return this.musicService.findAll();
  }

  /** POST /api/music — admin only */
  @Post()
  @UseGuards(JwtGuard)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name: string; url: string },
  ) {
    await this.usersService.assertIsAdmin(user.sub);
    return this.musicService.create(body.name, body.url);
  }

  /** PATCH /api/music/:id — admin only */
  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string; url?: string },
  ) {
    await this.usersService.assertIsAdmin(user.sub);
    return this.musicService.update(id, body);
  }

  /** DELETE /api/music/:id — admin only */
  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.usersService.assertIsAdmin(user.sub);
    return this.musicService.remove(id);
  }
}
