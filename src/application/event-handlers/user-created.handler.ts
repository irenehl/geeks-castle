import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserCreatedEvent } from '../../domain/events/user-created.event';
import { PasswordGeneratorService } from '../services/password-generator.service';
import { UpdateUserPasswordUseCase } from '../use-cases/update-user-password.use-case';

@Injectable()
export class UserCreatedHandler {
  private readonly logger = new Logger(UserCreatedHandler.name);

  constructor(
    private readonly passwordGenerator: PasswordGeneratorService,
    private readonly updateUserPassword: UpdateUserPasswordUseCase,
  ) {}

  @OnEvent('user.created')
  async handle(event: UserCreatedEvent): Promise<void> {
    if (event.hasPassword) {
      this.logger.log(
        `User ${event.userId} already has a password; skipping generation`,
      );
      return;
    }

    this.logger.log(
      `Generating secure password for user ${event.userId} (${event.email})`,
    );

    const { hashed } = await this.passwordGenerator.generateSecurePassword();

    await this.updateUserPassword.execute({
      userId: event.userId,
      hashedPassword: hashed,
    });

    this.logger.log(`Password updated in Firebase for user ${event.userId}`);
  }
}
