import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsObject,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for user registration
 */
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  password: string;
}

/**
 * DTO for user login
 */
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

/**
 * DTO for Google auth
 */
export class GoogleAuthDto {
  @IsString()
  credential: string;
}

/**
 * DTO for updating current user profile
 */
export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

/**
 * DTO for updating user role (admin only)
 */
export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['ADMIN', 'USER'])
  role: 'ADMIN' | 'USER';
}

/**
 * DTO for changing current user password
 */
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, {
    message: 'New password must be at least 8 characters long',
  })
  newPassword: string;
}

/**
 * DTO for admin resetting another user's password
 */
export class AdminResetPasswordDto {
  @IsString()
  @MinLength(8, {
    message: 'New password must be at least 8 characters long',
  })
  newPassword: string;
}

/**
 * DTOs for expense payments
 */
export class CreateExpensePaymentDto {
  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

export class UpdateExpensePaymentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

/**
 * DTOs for expenses
 */
export class CreateExpenseDto {
  @IsString()
  name: string;

  @IsNumber()
  budget: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpensePaymentDto)
  payments?: CreateExpensePaymentDto[];
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateExpensePaymentDto)
  payments?: UpdateExpensePaymentDto[];
}

/**
 * DTO for creating an event
 */
export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  eventTypeId?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsString()
  date: string; // ISO string

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsObject()
  coordinates?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  musicUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  googleMapLink?: string;

  @IsOptional()
  @IsString()
  khqrDollar?: string;

  @IsOptional()
  @IsString()
  khqrRiel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  type?: string;
}

/**
 * DTO for updating an event
 */
export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  eventTypeId?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsObject()
  coordinates?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  musicUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsString()
  googleMapLink?: string;

  @IsOptional()
  @IsString()
  khqrDollar?: string;

  @IsOptional()
  @IsString()
  khqrRiel?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  type?: string;
}

/**
 * DTO for creating a guest
 */
export class CreateGuestDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  greetingMessage?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  adultCount?: number;

  @IsOptional()
  childrenCount?: number;
}

/**
 * DTO for updating guest status (RSVP)
 */
export class UpdateGuestStatusDto {
  @IsString()
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'ACCEPTED';
}

/**
 * DTO for updating guest profile fields
 */
export class UpdateGuestDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  group?: string;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  greetingMessage?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  adultCount?: number;

  @IsOptional()
  childrenCount?: number;
}

export class CreateGiftDto {
  @IsString()
  guestId: string;

  @IsString()
  @IsIn(['CASH', 'KHQR'])
  paymentType: 'CASH' | 'KHQR';

  @IsString()
  @IsIn(['USD', 'KHR'])
  currencyType: 'USD' | 'KHR';

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateGiftDto {
  @IsOptional()
  @IsString()
  guestId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CASH', 'KHQR'])
  paymentType?: 'CASH' | 'KHQR';

  @IsOptional()
  @IsString()
  @IsIn(['USD', 'KHR'])
  currencyType?: 'USD' | 'KHR';

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
