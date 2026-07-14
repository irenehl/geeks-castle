import { PasswordGeneratorService } from './password-generator.service';

describe('PasswordGeneratorService', () => {
  let service: PasswordGeneratorService;

  beforeEach(() => {
    service = new PasswordGeneratorService();
  });

  describe('generateSecurePassword', () => {
    it('should generate a password with required character classes', async () => {
      const { plain, hashed } = await service.generateSecurePassword();

      expect(plain).toHaveLength(16);
      expect(plain).toMatch(/[a-z]/);
      expect(plain).toMatch(/[A-Z]/);
      expect(plain).toMatch(/[0-9]/);
      expect(plain).toMatch(/[!@#$%^&*()_+\-=[\]{}]/);
      expect(hashed).not.toEqual(plain);
      expect(hashed.startsWith('$2')).toBe(true);
    });

    it('should generate unique passwords on successive calls', async () => {
      const first = await service.generateSecurePassword();
      const second = await service.generateSecurePassword();

      expect(first.plain).not.toEqual(second.plain);
      expect(first.hashed).not.toEqual(second.hashed);
    });

    it('should produce a bcrypt hash that verifies the plain password', async () => {
      const { plain, hashed } = await service.generateSecurePassword();
      const matches = await service.comparePassword(plain, hashed);

      expect(matches).toBe(true);
    });
  });

  describe('hashPassword', () => {
    it('should hash a provided password with bcrypt', async () => {
      const plain = 'MySecurePass1!';
      const hashed = await service.hashPassword(plain);

      expect(hashed).not.toEqual(plain);
      expect(await service.comparePassword(plain, hashed)).toBe(true);
      expect(await service.comparePassword('wrong', hashed)).toBe(false);
    });
  });
});
