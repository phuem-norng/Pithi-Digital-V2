import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserProfileDto } from '../common/dtos';

const SALT_ROUNDS = 10;

/**
 * Users Service
 * Handles user creation, retrieval, and password management
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user with hashed password
   */
  async create(createUserDto: CreateUserDto) {
    const { email, password, name, phone } = createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        phone,
        password: hashedPassword,
        role: 'USER',
      },
    });

    // Return user without password
    return this.sanitizeUser(user);
  }

  /**
   * Find user by email (for login)
   */
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.sanitizeUser(user);
  }

  /**
   * Get all users (admin only)
   */
  async findAll(skip = 0, take = 10) {
    const users = await this.prisma.user.findMany({
      skip,
      take,
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  /**
   * Ensure user is admin (DB truth, not JWT claim)
   */
  async assertIsAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
  }

  /**
   * Update current user profile
   */
  async updateProfile(userId: string, updateUserProfileDto: UpdateUserProfileDto) {
    await this.findById(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateUserProfileDto,
      },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(userId: string, role: 'ADMIN' | 'USER') {
    await this.findById(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return this.sanitizeUser(user);
  }

  /**
   * Change current user's password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const isCurrentPasswordValid = await this.validatePassword(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'Password updated successfully' };
  }

  /**
   * Admin reset another user's password
   */
  async adminResetPassword(userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: 'User password reset successfully' };
  }

  /**
   * Validate password
   */
  async validatePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Remove password from user object before returning
   */
  private sanitizeUser(user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
