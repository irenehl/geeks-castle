import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'alice' })
  @Expose()
  username!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @Expose()
  email!: string;

  @ApiProperty({
    example: true,
    description: 'Indica si el usuario ya tiene contraseña hasheada en DB',
  })
  @Expose()
  hasPassword!: boolean;

  @ApiProperty({
    example: true,
    description: 'True cuando la contraseña fue generada por el servidor',
  })
  @Expose()
  mustChangePassword!: boolean;

  @ApiPropertyOptional({ example: '2026-07-14T18:00:00.000Z' })
  @Expose()
  createdAt?: string;
}

export class ListUsersMetaDto {
  @ApiProperty({ example: 1 })
  @Expose()
  page!: number;

  @ApiProperty({ example: 10 })
  @Expose()
  limit!: number;

  @ApiProperty({ example: 1 })
  @Expose()
  total!: number;

  @ApiProperty({ example: 1 })
  @Expose()
  totalPages!: number;
}

export class ListUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  @Expose()
  @Type(() => UserResponseDto)
  data!: UserResponseDto[];

  @ApiProperty({ type: ListUsersMetaDto })
  @Expose()
  @Type(() => ListUsersMetaDto)
  meta!: ListUsersMetaDto;
}

export class CreateUserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'alice' })
  @Expose()
  username!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @Expose()
  email!: string;

  @ApiProperty({
    example: true,
    description: 'True si el servidor generó la contraseña temporal',
  })
  @Expose()
  passwordGenerated!: boolean;

  @ApiProperty({ example: true })
  @Expose()
  mustChangePassword!: boolean;

  @ApiPropertyOptional({
    example: 'Xk9!mP2qR7$vL4nW',
    description:
      'Contraseña temporal en claro. Solo aparece una vez en el create; nunca en GET.',
  })
  @Expose()
  temporaryPassword?: string;

  @ApiPropertyOptional({
    example:
      'Guarda esta contraseña temporal ahora. No la volveremos a mostrar; cámbiala en el primer acceso.',
  })
  @Expose()
  message?: string;
}
