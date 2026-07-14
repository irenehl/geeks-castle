import { User } from './user.entity';

describe('User entity', () => {
  it('should report hasPassword as false when password is missing', () => {
    const user = User.create({
      id: '1',
      username: 'alice',
      email: 'alice@example.com',
    });

    expect(user.hasPassword()).toBe(false);
  });

  it('should update password and report hasPassword as true', () => {
    const user = User.create({
      id: '1',
      username: 'alice',
      email: 'alice@example.com',
    });

    user.updatePassword('hashed');

    expect(user.hasPassword()).toBe(true);
    expect(user.password).toBe('hashed');
  });
});
