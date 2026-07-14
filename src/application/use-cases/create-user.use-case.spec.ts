import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository.interface';
import { PasswordGeneratorService } from '../services/password-generator.service';
import { CreateUserUseCase } from './create-user.use-case';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordGenerator: jest.Mocked<PasswordGeneratorService>;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emitAsync'>>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
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

  it('should create a user without password and emit user.created', async () => {
    userRepository.create.mockImplementation(async (user) => user);

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
  });
});
