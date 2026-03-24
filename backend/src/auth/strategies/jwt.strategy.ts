import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/interfaces';

/**
 * JWT Strategy for Passport
 * Extracts and validates JWT tokens from Authorization header
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * Validate JWT payload
   * Called automatically by Passport after token is verified
   */
  async validate(payload: any): Promise<JwtPayload> {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
