import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/interfaces';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * JWT Strategy for Passport
 * Extracts and validates JWT tokens from Authorization header
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    });
  }

  /**
   * Validate JWT payload — reads role fresh from DB so role changes
   * take effect immediately without requiring re-login.
   */
  async validate(payload: any): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role as JwtPayload['role'],
    };
  }
}
