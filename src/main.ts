import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. IMPORTANTE: Habilitar CORS con configuración más robusta
  app.enableCors({
    origin: true, // Refleja el origen de la petición (permite cualquiera dinámicamente)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Permite envío de cookies/headers de autorización si el cliente lo requiere
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // Activamos validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían datos extra
    }),
  );

  await app.listen(3000);
}
bootstrap();
