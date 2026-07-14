import { NotFoundException } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { UpdateUserPasswordUseCase } from './update-user-password.use-case';

describe('UpdateUserPasswordUseCase', () => {
  let useCase: UpdateUserPasswordUseCase;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    useCase = new UpdateUserPasswordUseCase(userRepository);
  });

  it('should update the user password in the repository', async () => {
    const user = User.create({
      id: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
    });
    userRepository.findById.mockResolvedValue(user);
    userRepository.update.mockImplementation(async (u) => u);

    const updated = await useCase.execute({
      userId: 'user-1',
      hashedPassword: 'new-hash',
    });

    expect(updated.password).toBe('new-hash');
    expect(userRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', password: 'new-hash' }),
    );
  });

  it('should throw NotFoundException when user does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'missing', hashedPassword: 'hash' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
