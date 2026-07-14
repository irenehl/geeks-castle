import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { ListUsersUseCase } from './list-users.use-case';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new ListUsersUseCase(userRepository);
  });

  it('should return a paginated list without password hashes', async () => {
    userRepository.findMany.mockResolvedValue({
      total: 2,
      users: [
        User.create({
          id: 'user-1',
          username: 'alice',
          email: 'alice@example.com',
          password: 'hashed-secret',
          createdAt: '2026-07-14T12:00:00.000Z',
        }),
        User.create({
          id: 'user-2',
          username: 'bob',
          email: 'bob@example.com',
          createdAt: '2026-07-13T12:00:00.000Z',
        }),
      ],
    });

    const result = await useCase.execute();

    expect(userRepository.findMany).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      createdAt: undefined,
    });
    expect(result).toEqual({
      data: [
        {
          id: 'user-1',
          username: 'alice',
          email: 'alice@example.com',
          hasPassword: true,
          mustChangePassword: false,
          createdAt: '2026-07-14T12:00:00.000Z',
        },
        {
          id: 'user-2',
          username: 'bob',
          email: 'bob@example.com',
          hasPassword: false,
          mustChangePassword: false,
          createdAt: '2026-07-13T12:00:00.000Z',
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
    expect(JSON.stringify(result)).not.toContain('hashed-secret');
  });

  it('should forward page, limit and createdAt filter', async () => {
    userRepository.findMany.mockResolvedValue({ users: [], total: 0 });

    const result = await useCase.execute({
      page: 2,
      limit: 5,
      createdAt: '2026-07-14',
    });

    expect(userRepository.findMany).toHaveBeenCalledWith({
      page: 2,
      limit: 5,
      createdAt: '2026-07-14',
    });
    expect(result.meta).toEqual({
      page: 2,
      limit: 5,
      total: 0,
      totalPages: 0,
    });
    expect(result.data).toEqual([]);
  });

  it('should compute totalPages from total and limit', async () => {
    userRepository.findMany.mockResolvedValue({
      total: 12,
      users: [
        User.create({
          id: 'user-1',
          username: 'alice',
          email: 'alice@example.com',
          createdAt: '2026-07-14T12:00:00.000Z',
        }),
      ],
    });

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.meta.totalPages).toBe(2);
  });
});
