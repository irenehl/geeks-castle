import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { USER_REPOSITORY } from './../src/domain/repositories/user.repository.interface';
import { User } from './../src/domain/entities/user.entity';

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
          store.set(user.id, user);
          return user;
        },
        findById: async (id: string) => store.get(id) ?? null,
        findAll: async () => Array.from(store.values()),
        update: async (user: User) => {
          store.set(user.id, user);
          return user;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
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

    const getResponse = await request(app.getHttpServer())
      .get(`/users/${createResponse.body.id}`)
      .expect(200);

    expect(getResponse.body.hasPassword).toBe(true);
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

    const stored = store.get(createResponse.body.id);
    expect(stored?.password).toBeDefined();
    expect(stored?.password).not.toEqual('ProvidedPass1!');
  });

  it('GET /users lists all users without password hashes', async () => {
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

    expect(listResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: first.body.id,
          username: 'alice',
          email: 'alice@example.com',
          hasPassword: true,
        }),
        expect.objectContaining({
          id: second.body.id,
          username: 'bob',
          email: 'bob@example.com',
          hasPassword: true,
        }),
      ]),
    );
    expect(JSON.stringify(listResponse.body)).not.toContain('ProvidedPass1!');
    for (const user of listResponse.body) {
      expect(user).not.toHaveProperty('password');
    }
  });
});
