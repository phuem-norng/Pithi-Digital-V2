import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/** Prisma error codes that usually mean the database is unreachable or timing out. */
const DB_UNREACHABLE_CODES = new Set([
  'P1001', // Can't reach database server
  'P1002', // Database server unreachable / wrong host
  'P1008', // Operations timed out
  'P1017', // Server has closed the connection
]);

/**
 * Maps severe Prisma failures (connection / engine) and known "can't reach DB" codes
 * to HTTP 503. Other {@link Prisma.PrismaClientKnownRequestError}s become a generic 500.
 */
@Catch(
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
  Prisma.PrismaClientKnownRequestError,
)
export class PrismaDatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaDatabaseExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const unavailable = {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        'Database connection failed. Check DATABASE_URL, network access, and that the database is running.',
      error: 'Service Unavailable',
    };

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.warn(`PrismaClientInitializationError: ${exception.message}`);
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json(unavailable);
      return;
    }

    if (exception instanceof Prisma.PrismaClientRustPanicError) {
      this.logger.warn(`PrismaClientRustPanicError: ${exception.message}`);
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        ...unavailable,
        message:
          'Database engine error. Restart the backend or verify DATABASE_URL and Prisma setup.',
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (DB_UNREACHABLE_CODES.has(exception.code)) {
        this.logger.warn(`Prisma ${exception.code}: ${exception.message}`);
        response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            'Database is temporarily unavailable (network or server issue). Try again shortly.',
          error: 'Service Unavailable',
        });
        return;
      }

      this.logger.error(`Prisma ${exception.code}: ${exception.message}`);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database error',
        error: 'Internal Server Error',
      });
      return;
    }
  }
}
