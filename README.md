# GeeksCastle Backend Challenge 2026

API en NestJS + TypeScript con Firestore. Clean Architecture. Si creas un usuario sin password, se dispara un evento que genera una contraseña segura (bcrypt) y actualiza el doc.

Demo: [geeks-castle.vercel.app](https://geeks-castle.vercel.app) · Swagger: [/docs](https://geeks-castle.vercel.app/docs)  
DB: Firestore en GCP (el frontend/API de demo está en Vercel).

## Qué pide el challenge

| Requisito | Dónde |
|---|---|
| TypeScript + NestJS | todo el repo |
| Firebase (Admin SDK) | `src/infrastructure/firebase/` |
| Clean Architecture | `domain` / `application` / `infrastructure` / `presentation` |
| User con password opcional | entidad + `POST /users` |
| Si no hay password → generar segura + actualizar | evento `user.created` → handler |
| Evento al insertar | `@nestjs/event-emitter` |
| Tests (password + update) | `*.spec.ts` + e2e en `test/` |
| Emulador Firebase | `npm run emulator` |
| Docs para correr | este README |

## Stack

- TypeScript / NestJS
- Firestore (firebase-admin)
- bcrypt
- `@nestjs/event-emitter`

## Estructura

```
src/
├── domain/           # User, eventos, contrato del repo
├── application/      # use cases, password generator, handlers
├── infrastructure/   # Firebase + Firestore repo
└── presentation/     # controllers, DTOs, módulos Nest
```

```text
+-------------------------------------+
|           PRESENTATION              |
|  controllers, DTOs, filters Nest    |
|  (HTTP entra aqui)                  |
|  +-------------------------------+  |
|  |         APPLICATION           |  |
|  |  use cases, handlers,         |  |
|  |  password generator           |  |
|  |  +-------------------------+  |  |
|  |  |         DOMAIN          |  |  |
|  |  |  User, eventos,         |  |  |
|  |  |  contrato del repo      |  |  |
|  |  +-------------------------+  |  |
|  +-------------------------------+  |
|                                     |
|  INFRASTRUCTURE (al lado / afuera)  |
|  Firebase, Firestore repo           |
+-------------------------------------+
```

El dominio no sabe nada de Nest ni de Firebase. Las deps van hacia adentro.

### Flujo sin password

1. `POST /users` guarda el user en Firestore (sin password).
2. Sale el evento `user.created`.
3. El handler genera una temp password, la hashea, pone `mustChangePassword: true` y actualiza el doc.
4. En la respuesta del create ves `temporaryPassword` una sola vez. En GET nunca aparece.

## Cómo correrlo

Necesitas Node 20+, npm, y Java 11+ (el emulador de Firestore lo pide). La Firebase CLI ya viene en el proyecto.

```bash
npm install
cp .env.example .env
```

Con el `.env` de ejemplo apunta al emulador.

**Terminal 1**

```bash
npm run emulator
```

**Terminal 2**

```bash
npm run start:dev
```

- UI demo: http://localhost:3000
- Swagger: http://localhost:3000/docs
- Emulator UI: http://localhost:4000

Endpoints: `POST /users`, `GET /users`, `GET /users/:id`

Si arrancas Nest sin emulador ni credenciales, la UI abre igual pero el create falla al escribir en Firestore.

### Firestore de verdad

En `.env`:

```env
FIREBASE_USE_EMULATOR=false
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Validación

| Campo | Reglas |
|---|---|
| `username` | required, trim, 3–32, solo `[a-zA-Z0-9_]` |
| `email` | required, email válido, máx 254 |
| `password` | opcional. Si viene: 8–128, mayúscula, minúscula, dígito y un símbolo de `!@#$%^&*()_+-=[]{}` |
| `:id` | UUID v4 |

Errores de body → `400` con `message: string[]`.

## API

### Crear

```http
POST /users
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com"
}
```

Con password:

```json
{
  "username": "bob",
  "email": "bob@example.com",
  "password": "MySecurePass1!"
}
```

Si el server generó la password:

```json
{
  "id": "uuid",
  "username": "alice",
  "email": "alice@example.com",
  "passwordGenerated": true,
  "mustChangePassword": true,
  "temporaryPassword": "Xk9!mP2qR7$vL4nW",
  "message": "Guarda esta contraseña temporal ahora. No la volveremos a mostrar; cámbiala en el primer acceso."
}
```

Si el cliente mandó la suya, no viene `temporaryPassword`.

### Get / list

```http
GET /users/:id
GET /users?page=1&limit=10&createdAt=2026-07-14
```

`page` (default 1), `limit` (default 10, máx 100), `createdAt` filtra por día UTC.

En GET no se devuelve el hash ni `temporaryPassword`.

## Tests

```bash
npm test
npm run test:cov
```

Cubre generación de password, create/list/update, handler del evento, DTO y la entidad.

## Despliegue en GCP

No lo desplegué en Cloud Run (la demo va en Vercel + Firestore). En prod lo montaría así:

| Pieza | Servicio | Para qué |
|---|---|---|
| API Nest | Cloud Run | HTTP, Swagger, casos de uso |
| DB | Firestore | ya está ahí |
| Evento `user.created` | Pub/Sub | sacar el evento del proceso |
| Generar password | Cloud Functions | escucha Pub/Sub, hashea, update |

```
Cliente → Cloud Run (Nest)
            ├─ escribe en Firestore
            └─ publica en Pub/Sub (user.created)
                      ↓
              Cloud Function
                      └─ genera password, bcrypt, update en Firestore
```

Pasos rápidos: Dockerfile (Node 20 → `node dist/main`), secrets en Secret Manager, `gcloud run deploy`, topic `user-created`, function suscrita que hace el update. El SA de Cloud Run necesita Firestore + publish a Pub/Sub.

Por qué no todo en Functions: Nest se lleva mejor con Cloud Run (proceso HTTP completo). Pub/Sub + Function es para el side-effect del password, con reintentos. En local sigo con `EventEmitter` + `emitAsync` para devolver la temp password en el mismo POST.

## Decisiones

- Primero insert, después evento (como pide el challenge).
- Nunca se guarda el plain; solo bcrypt.
- El dominio depende del puerto `UserRepository`, no de Firestore.
- `emitAsync` para poder devolver `temporaryPassword` en la respuesta del create.
- Show-once: el plain solo sale en el POST.

## Scripts

| Script | Qué hace |
|---|---|
| `npm run start:dev` | Nest en watch |
| `npm run emulator` | Firestore emulator |
| `npm test` | unitarios |
| `npm run build` | build prod |
