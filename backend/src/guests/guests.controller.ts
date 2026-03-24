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
} from '@nestjs/common';
import type { JwtPayload } from '../common/interfaces';
import { GuestsService } from './guests.service';
import { CreateGuestDto, UpdateGuestStatusDto } from '../common/dtos';
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
   * GET /api/guests/invitation/:uniqueLink
   * Get guest by invitation link (public endpoint for RSVP page)
   */
  @Get('invitation/:uniqueLink')
  async findByInvitationLink(@Param('uniqueLink') uniqueLink: string) {
    return this.guestsService.findByInvitationLink(uniqueLink);
  }
}
