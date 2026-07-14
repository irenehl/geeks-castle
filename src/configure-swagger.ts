import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('User Service')
    .setDescription(
      'API de usuarios (NestJS + Firestore). Al crear un usuario sin contraseña se genera una temporal segura vía evento de dominio.',
    )
    .setVersion('1.0')
    .addTag('users', 'Operaciones sobre usuarios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'User Service API',
  });
}
