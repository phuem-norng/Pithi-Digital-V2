import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces';
import { CreateGiftDto, UpdateGiftDto } from '../common/dtos';
import { GiftsService } from './gifts.service';

@Controller('api/gifts')
@UseGuards(JwtGuard)
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Post(':eventId')
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateGiftDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.giftsService.create(eventId, user.sub, dto);
  }

  @Get('event/:eventId')
  async findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.giftsService.findByEvent(eventId, user.sub);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGiftDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.giftsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.giftsService.delete(id, user.sub);
  }
}
