import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from '../common/dtos';

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
    const { email, password, name } = createUserDto;

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
      include: {
        events: true,
      },
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
      include: {
        events: true,
      },
    });

    return users.map((user) => this.sanitizeUser(user));
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
