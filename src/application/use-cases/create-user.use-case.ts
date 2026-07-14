import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { User } from '../../domain/entities/user.entity';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { PasswordGeneratorService } from '../services/password-generator.service';

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
    await this.eventEmitter.emitAsync(
      'user.created',
      new UserCreatedEvent(
        created.id,
        created.username,
        created.email,
        created.hasPassword(),
      ),
    );

    return {
      id: created.id,
      username: created.username,
      email: created.email,
      passwordGenerated: passwordWasMissing,
    };
  }
}
