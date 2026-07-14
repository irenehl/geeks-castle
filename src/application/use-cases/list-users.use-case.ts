import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';

export const DEFAULT_LIST_PAGE = 1;
export const DEFAULT_LIST_LIMIT = 10;

export interface ListUsersInput {
  page?: number;
  limit?: number;
  createdAt?: string;
}

export interface ListedUser {
  id: string;
  username: string;
  email: string;
  hasPassword: boolean;
  mustChangePassword: boolean;
  createdAt?: string;
}

export interface ListUsersOutput {
  data: ListedUser[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListUsersInput = {}): Promise<ListUsersOutput> {
    const page = input.page ?? DEFAULT_LIST_PAGE;
    const limit = input.limit ?? DEFAULT_LIST_LIMIT;

    const { users, total } = await this.userRepository.findMany({
      page,
      limit,
      createdAt: input.createdAt,
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        hasPassword: user.hasPassword(),
        mustChangePassword: user.mustChangePassword,
        ...(user.createdAt !== undefined ? { createdAt: user.createdAt } : {}),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
