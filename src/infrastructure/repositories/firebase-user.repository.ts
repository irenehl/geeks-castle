import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { FirebaseService } from '../firebase/firebase.service';

interface UserDocument {
  id: string;
  username: string;
  email: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable()
export class FirebaseUserRepository implements UserRepository {
  private readonly collectionName = 'users';

  constructor(private readonly firebaseService: FirebaseService) {}

  async create(user: User): Promise<User> {
    const doc: UserDocument = {
      ...user.toPlainObject(),
      createdAt: new Date().toISOString(),
    };

    await this.firebaseService
      .getDb()
      .collection(this.collectionName)
      .doc(user.id)
      .set(doc);

    return user;
  }

  async findById(id: string): Promise<User | null> {
    const snapshot = await this.firebaseService
      .getDb()
      .collection(this.collectionName)
      .doc(id)
      .get();

    if (!snapshot.exists) {
      return null;
    }

    const data = snapshot.data() as UserDocument;
    return this.toUser(data);
  }

  async findAll(): Promise<User[]> {
    const snapshot = await this.firebaseService
      .getDb()
      .collection(this.collectionName)
      .get();

    return snapshot.docs.map((doc) => this.toUser(doc.data() as UserDocument));
  }

  async update(user: User): Promise<User> {
    const payload: Partial<UserDocument> = {
      ...user.toPlainObject(),
      updatedAt: new Date().toISOString(),
    };

    await this.firebaseService
      .getDb()
      .collection(this.collectionName)
      .doc(user.id)
      .update(payload);

    return user;
  }

  private toUser(data: UserDocument): User {
    return User.create({
      id: data.id,
      username: data.username,
      email: data.email,
      password: data.password,
    });
  }
}
