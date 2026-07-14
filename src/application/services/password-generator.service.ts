import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export interface GeneratedPassword {
  plain: string;
  hashed: string;
}

@Injectable()
export class PasswordGeneratorService {
  private readonly saltRounds = 10;
  private readonly passwordLength = 16;

  async generateSecurePassword(): Promise<GeneratedPassword> {
    const plain = this.createSecurePlainPassword();
    const hashed = await this.hashPassword(plain);
    return { plain, hashed };
  }

  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, this.saltRounds);
  }

  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private createSecurePlainPassword(): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}';
    const bytes = randomBytes(this.passwordLength);
    let password = '';

    for (let i = 0; i < this.passwordLength; i++) {
      password += charset[bytes[i]! % charset.length];
    }

    // Ensure at least one of each required character class
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}';

    const guaranteeBytes = randomBytes(4);
    const chars = password.split('');
    chars[0] = lower[guaranteeBytes[0]! % lower.length]!;
    chars[1] = upper[guaranteeBytes[1]! % upper.length]!;
    chars[2] = digits[guaranteeBytes[2]! % digits.length]!;
    chars[3] = symbols[guaranteeBytes[3]! % symbols.length]!;

    return chars.join('');
  }
}
