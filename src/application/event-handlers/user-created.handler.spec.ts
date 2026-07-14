import { PasswordGeneratorService } from '../services/password-generator.service';
import { UpdateUserPasswordUseCase } from '../use-cases/update-user-password.use-case';
import { UserCreatedHandler } from './user-created.handler';
import { UserCreatedEvent } from '../../domain/events/user-created.event';

describe('UserCreatedHandler', () => {
  let handler: UserCreatedHandler;
  let passwordGenerator: jest.Mocked<PasswordGeneratorService>;
  let updateUserPassword: jest.Mocked<UpdateUserPasswordUseCase>;

  beforeEach(() => {
    passwordGenerator = {
      generateSecurePassword: jest.fn(),
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    } as unknown as jest.Mocked<PasswordGeneratorService>;
    updateUserPassword = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateUserPasswordUseCase>;

    handler = new UserCreatedHandler(passwordGenerator, updateUserPassword);
  });

  it('should generate, persist, and return the temporary password when the user has none', async () => {
    passwordGenerator.generateSecurePassword.mockResolvedValue({
      plain: 'Generated1!',
      hashed: 'hashed-generated',
    });

    const result = await handler.handle(
      new UserCreatedEvent('user-1', 'alice', 'alice@example.com', false),
    );

    expect(passwordGenerator.generateSecurePassword).toHaveBeenCalled();
    expect(updateUserPassword.execute).toHaveBeenCalledWith({
      userId: 'user-1',
      hashedPassword: 'hashed-generated',
      mustChangePassword: true,
    });
    expect(result).toEqual({ temporaryPassword: 'Generated1!' });
  });

  it('should skip generation when the user already has a password', async () => {
    const result = await handler.handle(
      new UserCreatedEvent('user-2', 'bob', 'bob@example.com', true),
    );

    expect(passwordGenerator.generateSecurePassword).not.toHaveBeenCalled();
    expect(updateUserPassword.execute).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
