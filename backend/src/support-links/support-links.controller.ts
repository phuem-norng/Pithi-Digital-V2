import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../common/interfaces';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UsersService } from '../users/users.service';
import { SupportLinksService } from './support-links.service';

@Controller('api/support-links')
export class SupportLinksController {
  constructor(
    private supportLinksService: SupportLinksService,
    private usersService: UsersService,
  ) {}

  @Get()
  findPublic() {
    return this.supportLinksService.findPublic();
  }

  @Get('admin')
  @UseGuards(JwtGuard)
  async findAll(@CurrentUser() user: JwtPayload) {
    await this.usersService.assertIsAdmin(user.sub);
    return this.supportLinksService.findAll();
  }

  @Post()
  @UseGuards(JwtGuard)
  async create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      label: string;
      url: string;
      platform?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.usersService.assertIsAdmin(user.sub);
    return this.supportLinksService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtGuard)
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      label?: string;
      url?: string;
      platform?: string | null;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.usersService.assertIsAdmin(user.sub);
    return this.supportLinksService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.usersService.assertIsAdmin(user.sub);
    return this.supportLinksService.remove(id);
  }
}
