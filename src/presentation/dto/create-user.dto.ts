import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'alice',
    description: '3–32 caracteres; solo letras, números y guion bajo',
    minLength: 3,
    maxLength: 32,
  })
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

  @ApiProperty({
    example: 'alice@example.com',
    description: 'Email válido; máx. 254 caracteres',
    maxLength: 254,
  })
  @Transform(trimString)
  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  @MaxLength(254, {
    message: 'email must be at most 254 characters',
  })
  email!: string;

  @ApiPropertyOptional({
    example: 'MySecurePass1!',
    description:
      'Opcional. Si se omite, el servidor genera una contraseña temporal segura. Si se envía: 8–128 caracteres con mayúscula, minúscula, dígito y símbolo.',
    minLength: 8,
    maxLength: 128,
  })
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
