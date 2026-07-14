import { Module } from '@nestjs/common';
import { PasswordGeneratorService } from '../../application/services/password-generator.service';
import { UserCreatedHandler } from '../../application/event-handlers/user-created.handler';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UpdateUserPasswordUseCase } from '../../application/use-cases/update-user-password.use-case';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository.interface';
import { FirebaseModule } from '../../infrastructure/firebase/firebase.module';
import { FirebaseUserRepository } from '../../infrastructure/repositories/firebase-user.repository';
import { UsersController } from '../controllers/users.controller';

@Module({
  imports: [FirebaseModule],
  controllers: [UsersController],
  providers: [
    CreateUserUseCase,
    ListUsersUseCase,
    UpdateUserPasswordUseCase,
    PasswordGeneratorService,
    UserCreatedHandler,
    {
      provide: USER_REPOSITORY,
      useClass: FirebaseUserRepository,
    },
  ],
})
export class UsersModule {}
