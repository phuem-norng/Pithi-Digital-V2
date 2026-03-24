import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { JwtPayload } from '../common/interfaces';
import { UsersService } from './users.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Users Controller
 * Handles user-related routes
 */
@Controller('api/users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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
   * GET /api/users/:id
   * Get user by ID (for admin)
   */
  @Get(':id')
  @UseGuards(JwtGuard)
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
