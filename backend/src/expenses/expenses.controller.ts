import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces';
import { CreateExpenseDto, UpdateExpenseDto } from '../common/dtos';
import { ExpensesService } from './expenses.service';

@Controller('api/expenses')
@UseGuards(JwtGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post('event/:eventId')
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.create(eventId, user.sub, dto);
  }

  @Get('event/:eventId')
  async findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.findByEvent(eventId, user.sub);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.update(id, user.sub, dto);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.expensesService.delete(id, user.sub);
  }
}
