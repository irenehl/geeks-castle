# GeeksCastle Backend Challenge 2026

NestJS + TypeScript + Firebase (Firestore) solution for the Backend Developer Challenge 2026. Implements **Clean Architecture**. Creating a user without a password emits a domain event that generates a secure password (bcrypt-hashed) and updates the Firestore document.

## Challenge requirements → where they live

| # | Requirement | Status | Where |
|---|---|---|---|
| 1 | Language: **TypeScript** | ✅ | whole project, `tsconfig.json` strict |
| 2 | Framework: **NestJS** | ✅ | `src/` Nest modules, controllers, providers |
| 3 | Database: **Firebase** (Admin SDK) | ✅ | `src/infrastructure/firebase/*`, `firebase-admin` |
| 4 | **Clean Architecture** (domain / application / infrastructure / presentation) | ✅ | `src/domain`, `src/application`, `src/infrastructure`, `src/presentation` |
| 5 | `User` entity: `id` (auto), `username`, `email`, `password` (optional at create) | ✅ | `src/domain/entities/user.entity.ts`, `create-user.dto.ts` |
| 6 | If no password on insert, **generate one automatically** | ✅ | `create-user.use-case.ts` + `user-created.handler.ts` |
| 7 | Generated password must be **secure** | ✅ | `password-generator.service.ts` (CSPRNG, all char classes, bcrypt) |
| 8 | Record is **updated** with the generated password | ✅ | `update-user-password.use-case.ts` via repository `update()` |
| 9 | An **event fires on insert** that generates the password and updates the record | ✅ | `user.created` via `@nestjs/event-emitter`, `UserCreatedHandler` |
| 10 | Service to **insert a user** in Firebase | ✅ | `FirebaseUserRepository.create()` |
| 11 | Basic **docs** to configure and run | ✅ | this README + `.env.example` + emulator scripts |
| 12 | **Unit tests** for key functions (password generation, user update) | ✅ | `*.spec.ts` (22 unit tests) + e2e in `test/` |
| 13 | Hints: **bcrypt**, Firebase Admin SDK, **Firebase emulator** | ✅ | `bcrypt`, Admin SDK, `firebase.json` + `npm run emulator` |

A single `npm run start:dev` also serves a demo console (**The Credential Press**) at `/` for exercising the endpoints; the API routes are unchanged.

## Stack

| Requirement | Choice |
|---|---|
| Language | TypeScript |
| Framework | NestJS |
| Database | Firebase Firestore (Admin SDK) |
| Architecture | Clean Architecture |
| Password hashing | bcrypt |
| Events | `@nestjs/event-emitter` |

## Project structure

```
src/
├── domain/                  # Entities, repository contracts, domain events
├── application/             # Use cases, password service, event handlers
├── infrastructure/          # Firebase wiring + Firestore repository
└── presentation/            # Controllers, DTOs, Nest modules
```

**Flow when password is omitted**

1. `POST /users` persists the user in Firestore (no password).
2. `user.created` domain event is emitted.
3. `UserCreatedHandler` generates a secure password, hashes it with bcrypt, and updates the Firestore document.

## Prerequisites

- Node.js 20+
- npm
- Java 11+ (required by the Firestore emulator)
- Firebase CLI is included as a project dependency (`npx firebase ...`)

## Setup

```bash
npm install
cp .env.example .env
```

Default `.env` points at the local Firestore emulator.

## Run with Firebase Emulator

**Terminal 1 — Firestore emulator**

```bash
npm run emulator
# or: firebase emulators:start --only firestore
```

**Terminal 2 — NestJS API**

```bash
npm run start:dev
```

Open the demo console, **The Credential Press**, at [http://localhost:3000](http://localhost:3000) (create, list, and fetch by id against the live API).  
API routes: `POST /users`, `GET /users`, `GET /users/:id`  
Emulator UI: `http://localhost:4000`

> The API works without the emulator too: `npm run start:dev` alone boots Nest and serves the console. Without a running Firestore (emulator or credentials) the create call will error when it writes, which the console surfaces as a `JAMMED` result. Start the emulator (or set production credentials) for full create/fetch flows.

## Demo console UI (The Credential Press)

Static HTML/CSS/JS in `public/` is served by Nest at `/` (same process as the API), so a single `npm run start:dev` gives you the UI and the API. Use the stations to call `POST /users` (mint a record), `GET /users` (list all), and `GET /users/:id` (pull a record) without a separate frontend app. Client and server share the same validation rules, with inline field errors on blur and submit, and API `400` messages mapped back onto the matching fields.

## Validation rules

| Field | Rules |
|---|---|
| `username` | Required; trimmed; 3–32 chars; `[a-zA-Z0-9_]` only |
| `email` | Required; trimmed; valid email; max 254 |
| `password` | Optional. Empty/omit → server generates a secure password. If set: 8–128 chars with upper, lower, digit, and a symbol from `!@#$%^&*()_+-=[]{}` |
| `:id` (GET) | Must be a UUID v4 |

Invalid create bodies return Nest `400` with `message: string[]`. Invalid ids return `400` from `ParseUUIDPipe`.

## API

### Create user

```http
POST /users
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com"
}
```

Optional password:

```json
{
  "username": "bob",
  "email": "bob@example.com",
  "password": "MySecurePass1!"
}
```

Response:

```json
{
  "id": "uuid",
  "username": "alice",
  "email": "alice@example.com",
  "passwordGenerated": true
}
```

### Get user

```http
GET /users/:id
```

```json
{
  "id": "uuid",
  "username": "alice",
  "email": "alice@example.com",
  "hasPassword": true
}
```

### List users

```http
GET /users
```

```json
[
  {
    "id": "uuid",
    "username": "alice",
    "email": "alice@example.com",
    "hasPassword": true
  }
]
```

Password hashes are never returned (same shape as `GET /users/:id`).

## Tests

```bash
npm test
npm run test:cov
```

Covered areas:

- Secure password generation (character classes, uniqueness, bcrypt verify)
- Create-user use case (optional password + event emission)
- List-users use case (no password hashes in the response)
- Create-user DTO validation (trim, optional password, complexity, username pattern)
- Password update use case
- `user.created` event handler
- User domain entity

## Production Firebase

Set in `.env`:

```env
FIREBASE_USE_EMULATOR=false
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Design decisions

1. **Event-driven password generation** — Matches the challenge: insert first, then an event generates/updates the password when it was omitted.
2. **bcrypt hashes only** — Plain passwords are never stored; provided passwords are hashed before insert; generated ones are hashed in the event handler.
3. **Repository port** — Domain depends on `UserRepository`; Firestore is an infrastructure detail.
4. **`emitAsync`** — The create endpoint waits for the handler so a follow-up `GET` already sees `hasPassword: true`.

## Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | NestJS watch mode |
| `npm run emulator` | Firestore emulator |
| `npm test` | Unit tests |
| `npm run build` | Production build |
