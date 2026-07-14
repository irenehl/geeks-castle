import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Absolute asset URLs under /swagger-ui (copied to public/ on postinstall).
 * Nest's default relative /docs/* assets 404 on Vercel because swagger-ui-dist
 * static files are not included in the serverless bundle.
 */
const SWAGGER_ASSETS = '/swagger-ui';

export function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('User Service')
    .setDescription(
      'API de usuarios (NestJS + Firestore). Al crear un usuario sin contraseña se genera una temporal segura vía evento de dominio.',
    )
    .setVersion('1.0')
    .addTag('users', 'Operaciones sobre usuarios')
    .addServer('/')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'User Service API',
    customfavIcon: `${SWAGGER_ASSETS}/favicon-32x32.png`,
    customCssUrl: [`${SWAGGER_ASSETS}/swagger-ui.css`],
    customJs: [
      `${SWAGGER_ASSETS}/swagger-ui-bundle.js`,
      `${SWAGGER_ASSETS}/swagger-ui-standalone-preset.js`,
    ],
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
