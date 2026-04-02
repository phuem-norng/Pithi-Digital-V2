import {
  Controller,
  Get,
  Param,
  UseGuards,
  Patch,
  Body,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import type { JwtPayload } from '../common/interfaces';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  UpdateUserProfileDto,
  UpdateUserRoleDto,
  ChangePasswordDto,
  AdminResetPasswordDto,
} from '../common/dtos';

/**
 * Users Controller
 * Handles user-related routes
 */
@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /api/users
   * List users (admin only)
   */
  @Get()
  @UseGuards(JwtGuard)
  async getUsers(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip: string = '0',
    @Query('take') take: string = '50',
  ) {
    await this.usersService.assertIsAdmin(user.sub);

    return this.usersService.findAll(parseInt(skip), parseInt(take));
  }

  /**
   * GET /api/users/me
   * Get current logged-in user profile
   */
  @Get('me')
  @UseGuards(JwtGuard)
  async getCurrentUser(@CurrentUser() user: JwtPayload) {
    return this.usersService.findById(user.sub);
  }

  /**
   * PATCH /api/users/me
   * Update current logged-in user profile
   */
  @Patch('me')
  @UseGuards(JwtGuard)
  async updateCurrentUser(
    @CurrentUser() user: JwtPayload,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, updateUserProfileDto);
  }

  /**
   * PATCH /api/users/me/password
   * Change current logged-in user password
   */
  @Patch('me/password')
  @UseGuards(JwtGuard)
  async changeCurrentUserPassword(
    @CurrentUser() user: JwtPayload,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  /**
   * GET /api/users/:id
   * Get user by ID (for admin)
   */
  @Get(':id')
  @UseGuards(JwtGuard)
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  /**
   * PATCH /api/users/:id/role
   * Update user role (admin only)
   */
  @Patch(':id/role')
  @UseGuards(JwtGuard)
  async updateUserRole(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    await this.usersService.assertIsAdmin(user.sub);

    if (user.sub === id && updateUserRoleDto.role !== 'ADMIN') {
      throw new ForbiddenException('Admin cannot demote themselves');
    }

    return this.usersService.updateRole(id, updateUserRoleDto.role);
  }

  /**
   * PATCH /api/users/:id/password
   * Reset another user's password (admin only)
   */
  @Patch(':id/password')
  @UseGuards(JwtGuard)
  async resetUserPassword(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() adminResetPasswordDto: AdminResetPasswordDto,
  ) {
    await this.usersService.assertIsAdmin(user.sub);

    if (user.sub === id) {
      throw new ForbiddenException(
        'Use /api/users/me/password to change your own password',
      );
    }

    return this.usersService.adminResetPassword(id, adminResetPasswordDto.newPassword);
  }
}
