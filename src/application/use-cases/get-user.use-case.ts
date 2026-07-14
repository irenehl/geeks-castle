import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

export interface GetUserResult {
  id: string;
  username: string;
  email: string;
  hasPassword: boolean;
  mustChangePassword: boolean;
  createdAt?: string;
}

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<GetUserResult> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      hasPassword: user.hasPassword(),
      mustChangePassword: user.mustChangePassword,
      ...(user.createdAt !== undefined ? { createdAt: user.createdAt } : {}),
    };
  }
}
