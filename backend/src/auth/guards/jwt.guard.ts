import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Guard
 * Protects routes by validating JWT tokens
 * Usage: @UseGuards(JwtGuard)
 */
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {}
