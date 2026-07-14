import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import {
  CreateUserResponseDto,
  ListUsersResponseDto,
  UserResponseDto,
} from '../dto/user-response.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear usuario',
    description:
      'Si no se envía `password`, se emite el evento `user.created` y se genera una contraseña temporal segura (visible solo en esta respuesta).',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado',
    type: CreateUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Body inválido' })
  @ApiConflictResponse({
    description: 'Email o username ya registrados',
  })
  async create(@Body() dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const result = await this.createUserUseCase.execute({
      username: dto.username,
      email: dto.email,
      password: dto.password,
    });

    return plainToInstance(CreateUserResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios',
    description: 'Listado paginado. Nunca incluye hashes ni temporaryPassword.',
  })
  @ApiOkResponse({
    description: 'Listado paginado',
    type: ListUsersResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Query params inválidos' })
  async findAll(@Query() query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
    const result = await this.listUsersUseCase.execute({
      page: query.page,
      limit: query.limit,
      createdAt: query.createdAt,
    });

    return plainToInstance(ListUsersResponseDto, result, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario por id' })
  @ApiParam({
    name: 'id',
    description: 'UUID v4 del usuario',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Usuario encontrado',
    type: UserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'id no es un UUID v4' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserResponseDto> {
    const user = await this.getUserUseCase.execute(id);
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
