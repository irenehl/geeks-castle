import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

export const PASSWORD_COMPLEXITY_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}]).+$/;

const trimString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const emptyToUndefined = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

export class CreateUserDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'username is required' })
  @MinLength(3, {
    message: 'username must be at least 3 characters',
  })
  @MaxLength(32, {
    message: 'username must be at most 32 characters',
  })
  @Matches(USERNAME_PATTERN, {
    message: 'username must contain only letters, numbers, and underscores',
  })
  username!: string;

  @Transform(trimString)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  @MaxLength(254, {
    message: 'email must be at most 254 characters',
  })
  email!: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: 'password must be at least 8 characters',
  })
  @MaxLength(128, {
    message: 'password must be at most 128 characters',
  })
  @Matches(PASSWORD_COMPLEXITY_PATTERN, {
    message:
      'password must include uppercase, lowercase, a digit, and a symbol (!@#$%^&*()_+-=[]{})',
  })
  password?: string;
}
