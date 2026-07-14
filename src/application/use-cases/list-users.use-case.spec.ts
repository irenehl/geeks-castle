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
      findAll: jest.fn(),
      update: jest.fn(),
    };
    useCase = new ListUsersUseCase(userRepository);
  });

  it('should return all users without password hashes', async () => {
    userRepository.findAll.mockResolvedValue([
      User.create({
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-secret',
      }),
      User.create({
        id: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
      }),
    ]);

    const result = await useCase.execute();

    expect(userRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      {
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        hasPassword: true,
      },
      {
        id: 'user-2',
        username: 'bob',
        email: 'bob@example.com',
        hasPassword: false,
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('hashed-secret');
  });

  it('should return an empty list when there are no users', async () => {
    userRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
