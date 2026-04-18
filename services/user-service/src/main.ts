import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // strips unknown fields from the request body
    forbidNonWhitelisted: true, // throws error if unknown fields are sent
    transform: true,       // automatically transforms payloads to DTO instances
  }));

  await app.listen(
    parseInt(process.env.PORT ?? '3000'),
    '0.0.0.0',
  );
}
bootstrap();