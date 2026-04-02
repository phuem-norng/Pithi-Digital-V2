import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, CreateUserDto } from '../common/dtos';
import { UsersService } from '../users/users.service';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';

/**
 * Auth Service
 * Handles authentication logic: register, login, token validation
 */
@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   */
  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const token = this.generateToken(user.id, user.email, user.role);

    return {
      user,
      access_token: token,
    };
  }

  /**
   * Login user with email and password
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user.id, user.email, user.role);

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      access_token: token,
    };
  }

  /**
   * Login/register with Google ID token
   */
  async googleAuth(credential: string) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload?.name) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    let user = await this.usersService.findByEmail(payload.email);

    if (!user) {
      const generatedPassword = randomBytes(24).toString('hex');
      const createUserDto: CreateUserDto = {
        email: payload.email,
        name: payload.name,
        password: generatedPassword,
        phone: undefined,
      };

      await this.usersService.create(createUserDto);
      user = await this.usersService.findByEmail(payload.email);
    }

    if (!user) {
      throw new UnauthorizedException('Google authentication failed');
    }

    const token = this.generateToken(user.id, user.email, user.role);
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      access_token: token,
    };
  }

  /**
   * Validate JWT token payload
   */
  validateToken(payload: any) {
    if (!payload.sub || !payload.email) {
      throw new BadRequestException('Invalid token payload');
    }
    return payload;
  }

  /**
   * Generate JWT token
   */
  private generateToken(
    userId: string,
    email: string,
    role: 'CUSTOMER' | 'USER' | 'ADMIN',
  ) {
    const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    return this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
      },
      {
        secret,
        expiresIn: '7d',
      },
    );
  }
}
