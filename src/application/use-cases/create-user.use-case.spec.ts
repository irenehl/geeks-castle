import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { PasswordGeneratorService } from '../services/password-generator.service';
import {
  CreateUserUseCase,
  TEMPORARY_PASSWORD_WARNING,
} from './create-user.use-case';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordGenerator: jest.Mocked<PasswordGeneratorService>;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emitAsync'>>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findByUsername: jest.fn().mockResolvedValue(null),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    passwordGenerator = {
      generateSecurePassword: jest.fn(),
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    } as unknown as jest.Mocked<PasswordGeneratorService>;
    eventEmitter = {
      emitAsync: jest.fn().mockResolvedValue([]),
    };

    useCase = new CreateUserUseCase(
      userRepository,
      passwordGenerator,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  it('should create a user without password and return the temporary password once', async () => {
    userRepository.create.mockImplementation(async (user) => user);
    eventEmitter.emitAsync.mockResolvedValue([
      { temporaryPassword: 'TempPass1!' },
    ]);

    const result = await useCase.execute({
      username: 'alice',
      email: 'alice@example.com',
    });

    expect(passwordGenerator.hashPassword).not.toHaveBeenCalled();
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'alice',
        email: 'alice@example.com',
        password: undefined,
      }),
    );
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      'user.created',
      expect.objectContaining({
        username: 'alice',
        email: 'alice@example.com',
        hasPassword: false,
      }),
    );
    expect(result.passwordGenerated).toBe(true);
    expect(result.mustChangePassword).toBe(true);
    expect(result.temporaryPassword).toBe('TempPass1!');
    expect(result.message).toBe(TEMPORARY_PASSWORD_WARNING);
    expect(result.id).toBeDefined();
  });

  it('should hash a provided password before persisting', async () => {
    passwordGenerator.hashPassword.mockResolvedValue('hashed-password');
    userRepository.create.mockImplementation(async (user) => user);

    const result = await useCase.execute({
      username: 'bob',
      email: 'bob@example.com',
      password: 'ProvidedPass1!',
    });

    expect(passwordGenerator.hashPassword).toHaveBeenCalledWith(
      'ProvidedPass1!',
    );
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'hashed-password',
      }),
    );
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      'user.created',
      expect.objectContaining({ hasPassword: true }),
    );
    expect(result.passwordGenerated).toBe(false);
    expect(result.mustChangePassword).toBe(false);
    expect(result.temporaryPassword).toBeUndefined();
    expect(result.message).toBeUndefined();
  });

  it('should reject duplicate emails', async () => {
    userRepository.findByEmail.mockResolvedValue(
      User.create({
        id: 'existing',
        username: 'other',
        email: 'alice@example.com',
      }),
    );

    await expect(
      useCase.execute({ username: 'alice', email: 'alice@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('should reject duplicate usernames', async () => {
    userRepository.findByUsername.mockResolvedValue(
      User.create({
        id: 'existing',
        username: 'alice',
        email: 'other@example.com',
      }),
    );

    await expect(
      useCase.execute({ username: 'alice', email: 'alice@example.com' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('should delete the user when password generation fails', async () => {
    userRepository.create.mockImplementation(async (user) => user);
    eventEmitter.emitAsync.mockRejectedValue(new Error('handler failed'));

    await expect(
      useCase.execute({ username: 'alice', email: 'alice@example.com' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);

    expect(userRepository.delete).toHaveBeenCalledWith(expect.any(String));
  });
});
