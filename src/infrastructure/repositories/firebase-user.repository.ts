import { Injectable } from '@nestjs/common';
import type { Query } from 'firebase-admin/firestore';
import { User } from '../../domain/entities/user.entity';
import type {
  ListUsersQuery,
  ListUsersResult,
  UserRepository,
} from '../../domain/repositories/user.repository.interface';
import { FirebaseService } from '../firebase/firebase.service';

interface UserDocument {
  id: string;
  username: string;
  email: string;
  password?: string;
  mustChangePassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function utcDayBounds(createdAt: string): { start: string; end: string } {
  const day = createdAt.slice(0, 10);
  const start = `${day}T00:00:00.000Z`;
  const endDate = new Date(start);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  return { start, end: endDate.toISOString() };
}

@Injectable()
export class FirebaseUserRepository implements UserRepository {
  private readonly collectionName = 'users';

  constructor(private readonly firebaseService: FirebaseService) {}

  async create(user: User): Promise<User> {
    const createdAt = user.createdAt ?? new Date().toISOString();
    const doc: UserDocument = {
      ...user.toPlainObject(),
      createdAt,
    };

    await this.firebaseService
      .getDb()
      .collection(this.collectionName)
      .doc(user.id)
      .set(doc);

    return User.create({
      id: user.id,
      username: user.username,
      email: user.email,
      password: user.password,
      mustChangePassword: user.mustChangePassword,
      createdAt,
    });
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

  async findByEmail(email: string): Promise<User | null> {
    return this.findFirstByField('email', email);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.findFirstByField('username', username);
  }

  async findMany(query: ListUsersQuery): Promise<ListUsersResult> {
    let firestoreQuery: Query = this.firebaseService
      .getDb()
      .collection(this.collectionName);

    if (query.createdAt) {
      const { start, end } = utcDayBounds(query.createdAt);
      firestoreQuery = firestoreQuery
        .where('createdAt', '>=', start)
        .where('createdAt', '<', end);
    }

    const snapshot = await firestoreQuery.get();
    const users = snapshot.docs
      .map((doc) => this.toUser(doc.data() as UserDocument))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

    const total = users.length;
    const startIndex = (query.page - 1) * query.limit;
    const pageUsers = users.slice(startIndex, startIndex + query.limit);

    return { users: pageUsers, total };
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

  async delete(id: string): Promise<void> {
    await this.firebaseService
      .getDb()
      .collection(this.collectionName)
      .doc(id)
      .delete();
  }

  private async findFirstByField(
    field: 'email' | 'username',
    value: string,
  ): Promise<User | null> {
    const snapshot = await this.firebaseService
      .getDb()
      .collection(this.collectionName)
      .where(field, '==', value)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0]?.data() as UserDocument | undefined;
    return data ? this.toUser(data) : null;
  }

  private toUser(data: UserDocument): User {
    return User.create({
      id: data.id,
      username: data.username,
      email: data.email,
      password: data.password,
      mustChangePassword: data.mustChangePassword ?? false,
      createdAt: data.createdAt,
    });
  }
}
