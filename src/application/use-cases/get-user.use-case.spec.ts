import { NotFoundException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { GetUserUseCase } from './get-user.use-case';

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase;
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

    useCase = new GetUserUseCase(userRepository);
  });

  it('should return a public user view without password hash', async () => {
    userRepository.findById.mockResolvedValue(
      User.create({
        id: 'user-1',
        username: 'alice',
        email: 'alice@example.com',
        password: 'hashed-secret',
        mustChangePassword: true,
        createdAt: '2026-07-14T12:00:00.000Z',
      }),
    );

    const result = await useCase.execute('user-1');

    expect(result).toEqual({
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
      hasPassword: true,
      mustChangePassword: true,
      createdAt: '2026-07-14T12:00:00.000Z',
    });
    expect(JSON.stringify(result)).not.toContain('hashed-secret');
  });

  it('should throw NotFoundException when the user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
