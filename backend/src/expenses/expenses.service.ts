import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseDto,
  CreateExpensePaymentDto,
  UpdateExpenseDto,
  UpdateExpensePaymentDto,
} from '../common/dtos';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  private async isAdmin(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === 'ADMIN';
  }

  private async ensureEventAccess(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, userId: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    const canManageEvent = event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot manage expenses for this event');
    }

    return event;
  }

  private buildPaymentCreateInput(
    payments: Array<CreateExpensePaymentDto | UpdateExpensePaymentDto> = [],
  ) {
    return payments
      .filter(
        (payment) =>
          typeof payment.description === 'string' &&
          payment.description.trim().length > 0 &&
          typeof payment.amount === 'number' &&
          Number.isFinite(payment.amount),
      )
      .map((payment) => ({
        description: (payment.description || '').trim(),
        amount: Number(payment.amount),
        note: typeof payment.note === 'string' ? payment.note.trim() || null : null,
        paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
      }));
  }

  async create(eventId: string, userId: string, dto: CreateExpenseDto) {
    await this.ensureEventAccess(eventId, userId);

    const paymentInputs = this.buildPaymentCreateInput(dto.payments);

    return this.prisma.expense.create({
      data: {
        eventId,
        name: dto.name.trim(),
        budget: Number(dto.budget),
        note: dto.note?.trim() || null,
        payments: paymentInputs.length
          ? {
              create: paymentInputs,
            }
          : undefined,
      },
      include: {
        payments: {
          orderBy: { paidAt: 'asc' },
        },
      },
    });
  }

  async findByEvent(eventId: string, userId: string) {
    await this.ensureEventAccess(eventId, userId);

    return this.prisma.expense.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: {
        payments: {
          orderBy: { paidAt: 'asc' },
        },
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateExpenseDto) {
    const existing = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        event: { select: { id: true, userId: true } },
        payments: { select: { id: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    const canManageEvent = existing.event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot update expense from this event');
    }

    const data = {
      name: typeof dto.name === 'string' ? dto.name.trim() : existing.name,
      budget: typeof dto.budget === 'number' ? Number(dto.budget) : existing.budget,
      note: typeof dto.note === 'string' ? dto.note.trim() || null : existing.note,
    };

    if (dto.payments) {
      const paymentInputs = this.buildPaymentCreateInput(dto.payments);

      return this.prisma.$transaction(async (tx) => {
        await tx.expensePayment.deleteMany({ where: { expenseId: id } });
        const updated = await tx.expense.update({
          where: { id },
          data: {
            ...data,
            payments: paymentInputs.length
              ? {
                  create: paymentInputs,
                }
              : undefined,
          },
          include: {
            payments: {
              orderBy: { paidAt: 'asc' },
            },
          },
        });

        return updated;
      });
    }

    return this.prisma.expense.update({
      where: { id },
      data,
      include: {
        payments: {
          orderBy: { paidAt: 'asc' },
        },
      },
    });
  }

  async delete(id: string, userId: string) {
    const existing = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        event: { select: { userId: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    const canManageEvent = existing.event.userId === userId || (await this.isAdmin(userId));
    if (!canManageEvent) {
      throw new ForbiddenException('Cannot delete expense from this event');
    }

    return this.prisma.expense.delete({ where: { id } });
  }
}
