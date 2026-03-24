import {
  Controller,
  Post,
  Body,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto } from '../common/dtos';

/**
 * Auth Controller
 * Handles authentication routes: register, login
 */
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/auth/register
   * Register a new user
   */
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.authService.register(createUserDto);
    } catch (error: any) {
      if (error.message.includes('Email already registered')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * POST /api/auth/login
   * Login user with email and password
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
