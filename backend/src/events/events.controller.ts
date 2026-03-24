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
import { EventsService } from './events.service';
import { CreateEventDto, UpdateEventDto } from '../common/dtos';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Events Controller
 * Handles event-related routes
 */
@Controller('api/events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  /**
   * POST /api/events
   * Create a new event
   */
  @Post()
  @UseGuards(JwtGuard)
  async create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.create(user.sub, createEventDto);
  }

  /**
   * GET /api/events
   * Get all events for the current user
   */
  @Get()
  @UseGuards(JwtGuard)
  async findByUser(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '10',
  ) {
    return this.eventsService.findByUser(
      user.sub,
      parseInt(skip),
      parseInt(take),
    );
  }

  /**
   * GET /api/events/:id
   * Get a single event by ID
   */
  @Get(':id')
  @UseGuards(JwtGuard)
  async findById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  /**
   * GET /api/events/:id/stats
   * Get event statistics (accepted/declined/pending guests)
   */
  @Get(':id/stats')
  @UseGuards(JwtGuard)
  async getStats(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.getStats(id, user.sub);
  }

  /**
   * PUT /api/events/:id
   * Update an event
   */
  @Put(':id')
  @UseGuards(JwtGuard)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.update(id, user.sub, updateEventDto);
  }

  /**
   * DELETE /api/events/:id
   * Delete an event
   */
  @Delete(':id')
  @UseGuards(JwtGuard)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.eventsService.delete(id, user.sub);
  }
}
