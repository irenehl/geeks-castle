import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { User } from './../src/domain/entities/user.entity';
import type { ListUsersQuery } from './../src/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from './../src/domain/repositories/user.repository.interface';
import { FirebaseService } from './../src/infrastructure/firebase/firebase.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  const store = new Map<string, User>();

  beforeEach(async () => {
    store.clear();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useValue({
        create: async (user: User) => {
          const created = User.create({
            id: user.id,
            username: user.username,
            email: user.email,
            password: user.password,
            mustChangePassword: user.mustChangePassword,
            createdAt: user.createdAt ?? new Date().toISOString(),
          });
          store.set(created.id, created);
          return created;
        },
        findById: async (id: string) => store.get(id) ?? null,
        findByEmail: async (email: string) =>
          Array.from(store.values()).find((user) => user.email === email) ??
          null,
        findByUsername: async (username: string) =>
          Array.from(store.values()).find(
            (user) => user.username === username,
          ) ?? null,
        findMany: async (query: ListUsersQuery) => {
          let users = Array.from(store.values());

          if (query.createdAt) {
            const day = query.createdAt.slice(0, 10);
            users = users.filter((user) => user.createdAt?.startsWith(day));
          }

          users = users.sort((a, b) =>
            (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
          );

          const total = users.length;
          const start = (query.page - 1) * query.limit;
          return {
            users: users.slice(start, start + query.limit),
            total,
          };
        },
        update: async (user: User) => {
          store.set(user.id, user);
          return user;
        },
        delete: async (id: string) => {
          store.delete(id);
        },
      })
      .overrideProvider(FirebaseService)
      .useValue({
        onModuleInit: () => undefined,
        getDb: () => {
          throw new Error('Firebase should not be called in e2e');
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /users without password triggers generation and update', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'alice', email: 'alice@example.com' })
      .expect(201);

    expect(createResponse.body.passwordGenerated).toBe(true);
    expect(createResponse.body.mustChangePassword).toBe(true);
    expect(createResponse.body.temporaryPassword).toEqual(
      expect.stringMatching(/.{8,}/),
    );
    expect(createResponse.body.message).toEqual(expect.any(String));

    const getResponse = await request(app.getHttpServer())
      .get(`/users/${createResponse.body.id}`)
      .expect(200);

    expect(getResponse.body.hasPassword).toBe(true);
    expect(getResponse.body.mustChangePassword).toBe(true);
    expect(getResponse.body.createdAt).toEqual(expect.any(String));
    expect(getResponse.body).not.toHaveProperty('temporaryPassword');
    expect(getResponse.body).not.toHaveProperty('password');
  });

  it('POST /users with password keeps provided password (hashed)', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'bob',
        email: 'bob@example.com',
        password: 'ProvidedPass1!',
      })
      .expect(201);

    expect(createResponse.body.passwordGenerated).toBe(false);
    expect(createResponse.body.mustChangePassword).toBe(false);
    expect(createResponse.body).not.toHaveProperty('temporaryPassword');

    const stored = store.get(createResponse.body.id);
    expect(stored?.password).toBeDefined();
    expect(stored?.password).not.toEqual('ProvidedPass1!');
  });

  it('POST /users rejects duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'alice', email: 'alice@example.com' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'alice2', email: 'alice@example.com' })
      .expect(409);
  });

  it('GET /users paginates with defaults page=1 and limit=10', async () => {
    const first = await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'alice', email: 'alice@example.com' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'bob',
        email: 'bob@example.com',
        password: 'ProvidedPass1!',
      })
      .expect(201);

    const listResponse = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    expect(listResponse.body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
    expect(listResponse.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: first.body.id,
          username: 'alice',
          email: 'alice@example.com',
          hasPassword: true,
          mustChangePassword: true,
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: second.body.id,
          username: 'bob',
          email: 'bob@example.com',
          hasPassword: true,
          mustChangePassword: false,
          createdAt: expect.any(String),
        }),
      ]),
    );
    expect(JSON.stringify(listResponse.body)).not.toContain('ProvidedPass1!');
    expect(JSON.stringify(listResponse.body)).not.toContain(
      first.body.temporaryPassword,
    );
    for (const user of listResponse.body.data) {
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('temporaryPassword');
    }
  });

  it('GET /users supports page/limit and createdAt filter', async () => {
    const today = new Date().toISOString().slice(0, 10);

    await request(app.getHttpServer())
      .post('/users')
      .send({ username: 'alice', email: 'alice@example.com' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'bob',
        email: 'bob@example.com',
        password: 'ProvidedPass1!',
      })
      .expect(201);

    const pageResponse = await request(app.getHttpServer())
      .get('/users')
      .query({ page: 1, limit: 1 })
      .expect(200);

    expect(pageResponse.body.data).toHaveLength(1);
    expect(pageResponse.body.meta).toEqual({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });

    const filtered = await request(app.getHttpServer())
      .get('/users')
      .query({ createdAt: today })
      .expect(200);

    expect(filtered.body.meta.total).toBe(2);
    expect(filtered.body.data).toHaveLength(2);

    const empty = await request(app.getHttpServer())
      .get('/users')
      .query({ createdAt: '2000-01-01' })
      .expect(200);

    expect(empty.body).toEqual({
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });
});
