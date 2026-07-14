import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface ListUsersQuery {
  page: number;
  limit: number;
  /** ISO date (YYYY-MM-DD) or datetime; filters users created that calendar day (UTC). */
  createdAt?: string;
}

export interface ListUsersResult {
  users: User[];
  total: number;
}

export interface UserRepository {
  create(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findMany(query: ListUsersQuery): Promise<ListUsersResult>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
