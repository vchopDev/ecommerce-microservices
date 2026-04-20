import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';

export interface TestApp {
    app: INestApplication;
    generateToken: (role: 'USER' | 'ADMIN') => string;
}

export async function createTestApp(): Promise<TestApp> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication<NestFastifyApplication>(
        new FastifyAdapter(),
    );

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const jwtService = app.get(JwtService);

    const generateToken = (role: 'USER' | 'ADMIN') =>
        jwtService.sign({
            sub: '507f1f77bcf86cd799439011',
            email: 'test@test.com',
            role,
        });

    return { app, generateToken };
}