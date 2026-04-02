import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import type { JwtPayload } from '../common/interfaces';
import { GuestsService } from './guests.service';
import { CreateGuestDto, UpdateGuestDto, UpdateGuestStatusDto } from '../common/dtos';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Guests Controller
 * Handles guest-related routes
 */
@Controller('api/guests')
export class GuestsController {
  constructor(private guestsService: GuestsService) {}

  /**
   * GET /api/guests/public/by-slug/:slug/:guestId
   * Get a specific invited guest by event slug for locked public RSVP flow
   */
  @Get('public/by-slug/:slug/:guestId')
  async findPublicGuestBySlug(
    @Param('slug') slug: string,
    @Param('guestId') guestId: string,
  ) {
    return this.guestsService.findPublicGuestBySlug(slug, guestId);
  }

  /**
   * POST /api/guests/:eventId
   * Add a guest to an event
   */
  @Post(':eventId')
  @UseGuards(JwtGuard)
  async create(
    @Param('eventId') eventId: string,
    @Body() createGuestDto: CreateGuestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guestsService.create(eventId, user.sub, createGuestDto);
  }

  /**
   * GET /api/guests/event/:eventId
   * Get all guests for an event
   */
  @Get('event/:eventId')
  @UseGuards(JwtGuard)
  async findByEvent(
    @Param('eventId') eventId: string,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '50',
  ) {
    return this.guestsService.findByEvent(
      eventId,
      parseInt(skip),
      parseInt(take),
    );
  }

  /**
   * GET /api/guests/:id
   * Get a single guest
   */
  @Get(':id')
  @UseGuards(JwtGuard)
  async findById(@Param('id') id: string) {
    return this.guestsService.findById(id);
  }

  /**
   * PUT /api/guests/:id/status
   * Update guest RSVP status
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateGuestStatusDto,
  ) {
    return this.guestsService.updateStatus(id, updateStatusDto);
  }

  /**
   * PUT /api/guests/:id
   * Update guest details
   */
  @Put(':id')
  @UseGuards(JwtGuard)
  async update(
    @Param('id') id: string,
    @Body() updateGuestDto: UpdateGuestDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guestsService.update(id, user.sub, updateGuestDto);
  }

  /**
   * DELETE /api/guests/:id
   * Remove a guest from an event
   */
  @Delete(':id')
  @UseGuards(JwtGuard)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.guestsService.delete(id, user.sub);
  }

  /**
   * POST /api/guests/public/rsvp/:slug
   * Public RSVP submit by event slug
   */
  @Post('public/rsvp/:slug')
  async submitPublicRsvp(
    @Param('slug') slug: string,
    @Body()
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
    if (!payload?.name?.trim() && !payload?.guestId?.trim()) {
      throw new BadRequestException('Name is required');
    }

    if (!payload?.rsvpStatus) {
      throw new BadRequestException('RSVP status is required');
    }

    return this.guestsService.submitPublicRsvpBySlug(slug, {
      ...payload,
      name: payload.name?.trim() || '',
    });
  }
}
