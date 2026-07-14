import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

export interface ListedUser {
  id: string;
  username: string;
  email: string;
  hasPassword: boolean;
}

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(): Promise<ListedUser[]> {
    const users = await this.userRepository.findAll();

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      hasPassword: user.hasPassword(),
    }));
  }
}
