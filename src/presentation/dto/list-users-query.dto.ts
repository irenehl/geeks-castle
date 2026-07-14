import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import {
  DEFAULT_LIST_LIMIT,
  DEFAULT_LIST_PAGE,
} from '../../application/use-cases/list-users.use-case';

function toPositiveInt(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    example: 1,
    default: DEFAULT_LIST_PAGE,
    minimum: 1,
    description: 'Número de página',
  })
  @IsOptional()
  @Transform(({ value }) => toPositiveInt(value, DEFAULT_LIST_PAGE))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = DEFAULT_LIST_PAGE;

  @ApiPropertyOptional({
    example: 10,
    default: DEFAULT_LIST_LIMIT,
    minimum: 1,
    maximum: 100,
    description: 'Ítems por página (1–100)',
  })
  @IsOptional()
  @Transform(({ value }) => toPositiveInt(value, DEFAULT_LIST_LIMIT))
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = DEFAULT_LIST_LIMIT;

  /** Filter by creation day (UTC). Accepts YYYY-MM-DD or full ISO datetime. */
  @ApiPropertyOptional({
    example: '2026-07-14',
    description:
      'Filtro por día de creación (UTC). Acepta YYYY-MM-DD o datetime ISO.',
  })
  @IsOptional()
  @IsDateString()
  createdAt?: string;
}
