import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

export interface UpdateUserPasswordInput {
  userId: string;
  hashedPassword: string;
}

@Injectable()
export class UpdateUserPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateUserPasswordInput): Promise<User> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundException(`User with id ${input.userId} not found`);
    }

    user.updatePassword(input.hashedPassword);
    return this.userRepository.update(user);
  }
}
