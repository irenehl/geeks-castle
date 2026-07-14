import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { User } from '../../domain/entities/user.entity';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import type { UserCreatedHandlerResult } from '../event-handlers/user-created.handler';
import { PasswordGeneratorService } from '../services/password-generator.service';

export const TEMPORARY_PASSWORD_WARNING =
  'Guarda esta contraseña temporal ahora. No la volveremos a mostrar; cámbiala en el primer acceso.';

export interface CreateUserInput {
  username: string;
  email: string;
  password?: string;
}

export interface CreateUserOutput {
  id: string;
  username: string;
  email: string;
  passwordGenerated: boolean;
  mustChangePassword: boolean;
  temporaryPassword?: string;
  message?: string;
}

function extractTemporaryPassword(results: unknown[]): string | undefined {
  for (const result of results) {
    if (
      typeof result === 'object' &&
      result !== null &&
      'temporaryPassword' in result &&
      typeof (result as UserCreatedHandlerResult).temporaryPassword === 'string'
    ) {
      return (result as UserCreatedHandlerResult).temporaryPassword;
    }
  }
  return undefined;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly passwordGenerator: PasswordGeneratorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserOutput> {
    const existingEmail = await this.userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictException('email already registered');
    }

    const existingUsername = await this.userRepository.findByUsername(
      input.username,
    );
    if (existingUsername) {
      throw new ConflictException('username already taken');
    }

    const id = randomUUID();
    const providedPassword = input.password?.trim();

    let password: string | undefined;
    if (providedPassword) {
      password = await this.passwordGenerator.hashPassword(providedPassword);
    }

    const user = User.create({
      id,
      username: input.username,
      email: input.email,
      password,
    });

    const created = await this.userRepository.create(user);
    const passwordWasMissing = !created.hasPassword();

    try {
      const listenerResults = await this.eventEmitter.emitAsync(
        'user.created',
        new UserCreatedEvent(
          created.id,
          created.username,
          created.email,
          created.hasPassword(),
        ),
      );

      const temporaryPassword = passwordWasMissing
        ? extractTemporaryPassword(listenerResults)
        : undefined;

      if (passwordWasMissing && !temporaryPassword) {
        throw new InternalServerErrorException(
          'Failed to generate temporary password',
        );
      }

      return {
        id: created.id,
        username: created.username,
        email: created.email,
        passwordGenerated: passwordWasMissing,
        mustChangePassword: temporaryPassword != null,
        ...(temporaryPassword
          ? {
              temporaryPassword,
              message: TEMPORARY_PASSWORD_WARNING,
            }
          : {}),
      };
    } catch (error) {
      await this.userRepository.delete(created.id);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to complete user creation');
    }
  }
}
