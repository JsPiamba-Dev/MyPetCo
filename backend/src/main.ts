
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global de todos los endpoints
  app.setGlobalPrefix('api');

  // Permite las solicitudes desde el frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Validación global de datos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Puerto del backend
  const port = Number(process.env.PORT) || 3001;

  await app.listen(port, '0.0.0.0');

  console.log(`🐾 MyPetCo API ejecutándose en http://localhost:${port}/api`);
}

bootstrap();
