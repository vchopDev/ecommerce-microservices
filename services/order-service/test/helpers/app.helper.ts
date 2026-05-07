import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "../../src/app.module";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { CART_CLIENT } from "../../src/cart/cart-client.interface";
import { CATALOG_CLIENT } from "../../src/catalog/catalog-client.interface";
import { RabbitMQService } from "../../src/rabbitmq/rabbitmq.service";

export const mockCartClient = {
    getCart: jest.fn(),
    clearCart: jest.fn(),
};

export const mockCatalogClient = {
    getProduct: jest.fn(),
};

export const mockRabbitMQService = {
    publish: jest.fn(),
};

export interface TestApp {
    app: INestApplication;
    generateToken: (role: "USER" | "ADMIN") => string;
}

export async function createTestApp(): Promise<TestApp> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    })
        .overrideProvider(CART_CLIENT).useValue(mockCartClient)
        .overrideProvider(CATALOG_CLIENT).useValue(mockCatalogClient)
        .overrideProvider(RabbitMQService).useValue(mockRabbitMQService)
        .compile();

    const app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
    }));

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const jwtService = app.get(JwtService);

    const generateToken = (role: "USER" | "ADMIN") => jwtService.sign({
        sub: '06404c10-c45c-4565-828d-b4bb5c11738e',
        email: 'victor@test.com',
        role,
    });

    return { app, generateToken };
}