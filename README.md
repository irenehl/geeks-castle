# GeeksCastle Backend Challenge 2026

Solución en NestJS + TypeScript + Firebase (Firestore) para el Backend Developer Challenge 2026. Implementa **Clean Architecture**. Al crear un usuario sin contraseña se emite un evento de dominio que genera una contraseña segura (hasheada con bcrypt) y actualiza el documento en Firestore.

## Requisitos del challenge → dónde están

| # | Requisito | Estado | Dónde |
|---|---|---|---|
| 1 | Lenguaje: **TypeScript** | ✅ | todo el proyecto, `tsconfig.json` en modo strict |
| 2 | Framework: **NestJS** | ✅ | módulos Nest, controllers y providers en `src/` |
| 3 | Base de datos: **Firebase** (Admin SDK) | ✅ | `src/infrastructure/firebase/*`, `firebase-admin` |
| 4 | **Clean Architecture** (domain / application / infrastructure / presentation) | ✅ | `src/domain`, `src/application`, `src/infrastructure`, `src/presentation` |
| 5 | Entidad `User`: `id` (auto), `username`, `email`, `password` (opcional al crear) | ✅ | `src/domain/entities/user.entity.ts`, `create-user.dto.ts` |
| 6 | Si no hay contraseña al insertar, **generar una automáticamente** | ✅ | `create-user.use-case.ts` + `user-created.handler.ts` |
| 7 | La contraseña generada debe ser **segura** | ✅ | `password-generator.service.ts` (CSPRNG, todas las clases de caracteres, bcrypt) |
| 8 | El registro se **actualiza** con la contraseña generada | ✅ | `update-user-password.use-case.ts` vía `update()` del repositorio |
| 9 | Un **evento se dispara al insertar** que genera la contraseña y actualiza el registro | ✅ | `user.created` vía `@nestjs/event-emitter`, `UserCreatedHandler` |
| 10 | Servicio para **insertar un usuario** en Firebase | ✅ | `FirebaseUserRepository.create()` |
| 11 | **Documentación** básica para configurar y ejecutar | ✅ | este README + `.env.example` + scripts del emulador |
| 12 | **Tests unitarios** de las funciones clave (generación de contraseña, actualización de usuario) | ✅ | `*.spec.ts` (22 tests unitarios) + e2e en `test/` |
| 13 | Hints: **bcrypt**, Firebase Admin SDK, **emulador de Firebase** | ✅ | `bcrypt`, Admin SDK, `firebase.json` + `npm run emulator` |

Un solo `npm run start:dev` también sirve una consola demo en `/` para probar los endpoints; las rutas de la API no cambian.

## Stack

| Requisito | Elección |
|---|---|
| Lenguaje | TypeScript |
| Framework | NestJS |
| Base de datos | Firebase Firestore (Admin SDK) |
| Arquitectura | Clean Architecture |
| Hash de contraseñas | bcrypt |
| Eventos | `@nestjs/event-emitter` |

## Estructura del proyecto

```
src/
├── domain/                  # Entidades, contratos del repositorio, eventos de dominio
├── application/             # Casos de uso, servicio de contraseñas, handlers de eventos
├── infrastructure/          # Wiring de Firebase + repositorio Firestore
└── presentation/            # Controllers, DTOs, módulos Nest
```

**Flujo cuando se omite la contraseña**

1. `POST /users` persiste el usuario en Firestore (sin contraseña).
2. Se emite el evento de dominio `user.created`.
3. `UserCreatedHandler` genera una contraseña temporal segura, la hashea con bcrypt, actualiza el documento con `mustChangePassword: true` y devuelve el valor en claro.
4. La respuesta del create incluye `temporaryPassword` **una sola vez** (nunca se guarda en claro; nunca aparece en GET).

## Requisitos previos

- Node.js 20+
- npm
- Java 11+ (requerido por el emulador de Firestore)
- Firebase CLI está incluida como dependencia del proyecto (`npx firebase ...`)

## Configuración

```bash
npm install
cp .env.example .env
```

El `.env` por defecto apunta al emulador local de Firestore.

## Ejecutar con el emulador de Firebase

**Terminal 1 — Emulador de Firestore**

```bash
npm run emulator
# o: firebase emulators:start --only firestore
```

**Terminal 2 — API NestJS**

```bash
npm run start:dev
```

Abre la consola demo en [http://localhost:3000](http://localhost:3000) (crear, listar y obtener por id contra la API en vivo).  
Swagger UI: [http://localhost:3000/docs](http://localhost:3000/docs)  
Rutas de la API: `POST /users`, `GET /users?page&limit&createdAt`, `GET /users/:id`  
UI del emulador: `http://localhost:4000`

> La API también funciona sin el emulador: solo `npm run start:dev` arranca Nest y sirve la consola. Sin Firestore en ejecución (emulador o credenciales), la creación fallará al escribir; la consola lo muestra como resultado `ERROR`. Arranca el emulador (o configura credenciales de producción) para los flujos completos de crear/obtener.

## Consola demo (UI)

HTML/CSS/JS estático en `public/` servido por Nest en `/` (mismo proceso que la API), así que un solo `npm run start:dev` te da la UI y la API. Usa las secciones para llamar a `POST /users` (crear usuario), `GET /users` (listar paginado + filtro `createdAt`) y `GET /users/:id` (obtener por id) sin una app frontend aparte. Cliente y servidor comparten las mismas reglas de validación, con errores en línea al blur y al enviar, y los mensajes `400` de la API mapeados a los campos correspondientes.

## Reglas de validación

| Campo | Reglas |
|---|---|
| `username` | Obligatorio; sin espacios extremos; 3–32 caracteres; solo `[a-zA-Z0-9_]` |
| `email` | Obligatorio; sin espacios extremos; email válido; máx. 254 |
| `password` | Opcional. Vacío/omitido → el servidor genera una contraseña temporal segura (se muestra una sola vez en el create). Si se envía: 8–128 caracteres con mayúscula, minúscula, dígito y un símbolo de `!@#$%^&*()_+-=[]{}` |
| `:id` (GET) | Debe ser un UUID v4 |

Los bodies de creación inválidos devuelven Nest `400` con `message: string[]`. Los ids inválidos devuelven `400` desde `ParseUUIDPipe`.

## API

Documentación interactiva (OpenAPI / Swagger) en `/docs` cuando la app está en marcha.

### Crear usuario

```http
POST /users
Content-Type: application/json

{
  "username": "alice",
  "email": "alice@example.com"
}
```

Contraseña opcional:

```json
{
  "username": "bob",
  "email": "bob@example.com",
  "password": "MySecurePass1!"
}
```

Respuesta (contraseña generada — temporal visible **solo aquí**):

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

Respuesta (el cliente envió su contraseña):

```json
{
  "id": "uuid",
  "username": "bob",
  "email": "bob@example.com",
  "passwordGenerated": false,
  "mustChangePassword": false
}
```

### Obtener usuario

```http
GET /users/:id
```

```json
{
  "id": "uuid",
  "username": "alice",
  "email": "alice@example.com",
  "hasPassword": true,
  "mustChangePassword": true,
  "createdAt": "2026-07-14T18:00:00.000Z"
}
```

### Listar usuarios

```http
GET /users?page=1&limit=10&createdAt=2026-07-14
```

Query params (todos opcionales):

| Param | Default | Descripción |
| --- | --- | --- |
| `page` | `1` | Página (≥ 1) |
| `limit` | `10` | Ítems por página (1–100) |
| `createdAt` | — | Día UTC (`YYYY-MM-DD` o ISO); filtra por fecha de creación |

```json
{
  "data": [
    {
      "id": "uuid",
      "username": "alice",
      "email": "alice@example.com",
      "hasPassword": true,
      "mustChangePassword": true,
      "createdAt": "2026-07-14T18:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

Los hashes y `temporaryPassword` nunca se devuelven en GET (misma forma en list y get-by-id).

## Tests

```bash
npm test
npm run test:cov
```

Áreas cubiertas:

- Generación segura de contraseñas (clases de caracteres, unicidad, verificación con bcrypt)
- Caso de uso create-user (contraseña opcional + emisión de evento)
- Caso de uso list-users (sin hashes de contraseña en la respuesta)
- Validación del DTO create-user (trim, contraseña opcional, complejidad, patrón de username)
- Caso de uso de actualización de contraseña
- Handler del evento `user.created`
- Entidad de dominio User

## Firebase en producción

Configura en `.env`:

```env
FIREBASE_USE_EMULATOR=false
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Decisiones de diseño

1. **Generación de contraseña orientada a eventos** — Cumple el challenge: primero se inserta, luego un evento genera/actualiza la contraseña cuando se omitió.
2. **Solo hashes bcrypt** — Las contraseñas en texto plano nunca se almacenan; las proporcionadas se hashean antes del insert; las generadas se hashean en el event handler.
3. **Puerto del repositorio** — El dominio depende de `UserRepository`; Firestore es un detalle de infraestructura.
4. **`emitAsync`** — El endpoint de creación espera al handler para devolver `temporaryPassword` en la misma respuesta y para que un `GET` posterior ya vea `hasPassword: true`.
5. **Contraseña temporal (show-once)** — El plain solo viaja en la respuesta del `POST /users`; en DB queda el hash y `mustChangePassword`.

## Scripts

| Script | Descripción |
|---|---|
| `npm run start:dev` | NestJS en modo watch (+ Swagger en `/docs`) |
| `npm run emulator` | Emulador de Firestore |
| `npm test` | Tests unitarios |
| `npm run build` | Build de producción |
