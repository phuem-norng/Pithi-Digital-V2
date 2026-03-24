import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, CreateUserDto } from '../common/dtos';
import { UsersService } from '../users/users.service';

/**
 * Auth Service
 * Handles authentication logic: register, login, token validation
 */
@Injectable()
export class AuthService {
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
    role: 'USER' | 'ADMIN',
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
