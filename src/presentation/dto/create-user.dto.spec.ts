import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

async function validateDto(plain: Record<string, unknown>) {
  const dto = plainToInstance(CreateUserDto, plain);
  const errors = await validate(dto);
  return {
    dto,
    errors,
    messages: errors.flatMap((error) =>
      Object.values(error.constraints ?? {}),
    ),
  };
}

describe('CreateUserDto', () => {
  it('accepts a valid payload without password', async () => {
    const { errors, dto } = await validateDto({
      username: 'alice',
      email: 'alice@example.com',
    });

    expect(errors).toHaveLength(0);
    expect(dto.password).toBeUndefined();
  });

  it('trims username and email', async () => {
    const { errors, dto } = await validateDto({
      username: '  bob_1  ',
      email: '  bob@example.com  ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.username).toBe('bob_1');
    expect(dto.email).toBe('bob@example.com');
  });

  it('treats empty password as omitted', async () => {
    const { errors, dto } = await validateDto({
      username: 'carol',
      email: 'carol@example.com',
      password: '   ',
    });

    expect(errors).toHaveLength(0);
    expect(dto.password).toBeUndefined();
  });

  it('accepts a password that meets complexity rules', async () => {
    const { errors, dto } = await validateDto({
      username: 'dave',
      email: 'dave@example.com',
      password: 'Secure1!',
    });

    expect(errors).toHaveLength(0);
    expect(dto.password).toBe('Secure1!');
  });

  it('rejects username that is too short', async () => {
    const { messages } = await validateDto({
      username: 'ab',
      email: 'ab@example.com',
    });

    expect(messages).toContain('username must be at least 3 characters');
  });

  it('rejects username with invalid characters', async () => {
    const { messages } = await validateDto({
      username: 'alice-doe',
      email: 'alice@example.com',
    });

    expect(messages).toContain(
      'username must contain only letters, numbers, and underscores',
    );
  });

  it('rejects invalid email', async () => {
    const { messages } = await validateDto({
      username: 'alice',
      email: 'not-an-email',
    });

    expect(messages).toContain('email must be a valid email address');
  });

  it('rejects password that is too short', async () => {
    const { messages } = await validateDto({
      username: 'alice',
      email: 'alice@example.com',
      password: 'Ab1!',
    });

    expect(messages).toContain('password must be at least 8 characters');
  });

  it('rejects password missing complexity classes', async () => {
    const { messages } = await validateDto({
      username: 'alice',
      email: 'alice@example.com',
      password: 'alllowercase1',
    });

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringContaining('password must include uppercase'),
      ]),
    );
  });

  it('rejects missing username', async () => {
    const { messages } = await validateDto({
      email: 'alice@example.com',
    });

    expect(messages.length).toBeGreaterThan(0);
  });
});
