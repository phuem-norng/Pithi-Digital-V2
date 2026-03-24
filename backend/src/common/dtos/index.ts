import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

/**
 * DTO for user registration
 */
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

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
 * DTO for creating an event
 */
export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  type: 'WEDDING' | 'BIRTHDAY' | 'CEREMONY' | 'HOUSEWARMING' | 'OTHER';

  @IsString()
  date: string; // ISO string

  @IsString()
  location: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;
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
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;
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
}

/**
 * DTO for updating guest status (RSVP)
 */
export class UpdateGuestStatusDto {
  @IsString()
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}
