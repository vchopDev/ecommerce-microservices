import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../../src/app.module';
import { CATALOG_CLIENT } from '../../src/catalog/catalog-client.interface';

export const mockCatalogClient = {
    getProduct: jest.fn(),
};

export interface TestApp {
    app: INestApplication;
    generateToken: (role: 'USER' | 'ADMIN') => string;
}

export async function createTestApp(): Promise<TestApp> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideProvider(CATALOG_CLIENT)
        .useValue(mockCatalogClient)
        .compile();

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
            sub: '06404c10-c45c-4565-828d-b4bb5c11738e',
            email: 'victor@test.com',
            role,
        });

    return { app, generateToken };
}