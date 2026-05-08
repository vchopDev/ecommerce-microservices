import { INestApplication } from "@nestjs/common";
import { createTestApp, mockCartClient, mockCatalogClient, mockRabbitMQService } from "./helpers/app.helper";
import request from 'supertest';
import { PrismaService } from "../src/prisma/prisma.service";


const userId = '06404c10-c45c-4565-828d-b4bb5c11738e';

const validProduct = {
    id: 'p1',
    name: 'MacBook Pro 16',
    price: 2499.99,
    stock: 10,
    isActive: true,
    images: [],
};

const validCart = {
    userId,
    items: [
        { productId: 'p1', name: 'MacBook Pro 16', price: 2499.99, quantity: 1 },
    ],
    updatedAt: new Date().toISOString(),
};


describe('Orders Service (e2e)', () => {
    let app: INestApplication;
    let generateToken: (role: "USER" | "ADMIN") => string;
    let userToken: string;
    let prisma: PrismaService;

    beforeAll(async () => {
        ({ app, generateToken } = await createTestApp());
        prisma = app.get(PrismaService);
        userToken = generateToken("USER");
    });

    beforeEach(async () => {
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        jest.clearAllMocks();
    });


    afterAll(async () => {
        await prisma.orderItem.deleteMany();
        await prisma.order.deleteMany();
        await app.close();
    });

    describe('POST /orders/checkout', () => {

        it('should return 401 if user is not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .post('/orders/checkout')
                .send({});
            expect(response.status).toBe(401);
        });

        it('should create an order from cart and return 201', async () => {
            mockCartClient.getCart.mockResolvedValue(validCart);
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            mockCartClient.clearCart.mockResolvedValue(undefined);
            mockRabbitMQService.publish.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .post('/orders/checkout')
                .set('Authorization', `Bearer ${generateToken('USER')}`)
                .send({});

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('items');
            expect(response.body).toHaveProperty('totalPrice');
        });

        it('should return 400 if cart is empty', async () => {
            mockCartClient.getCart.mockResolvedValue({
                ...validCart,
                items: [],
            });

            const response = await request(app.getHttpServer())
                .post('/orders/checkout')
                .set('Authorization', `Bearer ${generateToken('USER')}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Cart is empty');

        });

        it('should return 400 if product is inactive', async () => {
            mockCartClient.getCart.mockResolvedValue({
                ...validCart,
                items: [
                    { productId: 'p1', name: 'MacBook Pro 16', price: 2499.99, quantity: 1 },
                ],
            });
            mockCatalogClient.getProduct.mockResolvedValue({ ...validProduct, isActive: false });

            const response = await request(app.getHttpServer())
                .post('/orders/checkout')
                .set('Authorization', `Bearer ${generateToken('USER')}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Product p1 is not available');
        });

        it('should return 500 if catalog service is not available', async () => {
            mockCartClient.getCart.mockResolvedValue(validCart);
            mockCatalogClient.getProduct.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .post('/orders/checkout')
                .set('Authorization', `Bearer ${generateToken('USER')}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
        });

        it('should return 500 if cart service is not available', async () => {
            mockCartClient.getCart.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .post('/orders/checkout')
                .set('Authorization', `Bearer ${generateToken('USER')}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message');
        });
    });

    describe('GET /orders', () => {
        it('should return 401 if user is not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .get('/orders');
            expect(response.status).toBe(401);
        });

        it('should return all orders for the user', async () => {
            mockCartClient.getCart.mockResolvedValue(validCart);
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            mockCartClient.clearCart.mockResolvedValue(undefined);
            mockRabbitMQService.publish.mockResolvedValue(undefined);

            await request(app.getHttpServer())
                .post('/orders/checkout')
                .set('Authorization', `Bearer ${userToken}`);

            const response = await request(app.getHttpServer())
                .get('/orders')
                .set('Authorization', `Bearer ${userToken}`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].userId).toEqual(userId);
        });
    });

    describe("GET /orders/:id", () => {
        it("should return 401 if user is not authenticated", async () => {
            const response = await request(app.getHttpServer())
                .get('/orders/1');
            expect(response.status).toBe(401);
        });

        it('should return order by id for authenticated user', async () => {
            mockCartClient.getCart.mockResolvedValue(validCart);
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            mockCartClient.clearCart.mockResolvedValue(undefined);
            mockRabbitMQService.publish.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .post('/orders/checkout')
                .set('Authorization', `Bearer ${generateToken('USER')}`)
                .send({});
            const orderId = response.body.id;

            const response2 = await request(app.getHttpServer())
                .get(`/orders/${orderId}`)
                .set('Authorization', `Bearer ${generateToken('USER')}`);
            expect(response2.status).toBe(200);
            expect(response2.body).toHaveProperty('id');
            expect(response2.body.id).toEqual(orderId);
            expect(response2.body.userId).toEqual(userId);
        });

        it('should return 404 if order not found', async () => {
            const response = await request(app.getHttpServer())
                .get('/orders/00000000-0000-0000-0000-000000000000')
                .set('Authorization', `Bearer ${userToken}`);
            expect(response.status).toBe(404);
        });
    });

    describe('PATCH /orders/:id/cancel', () => {
        it('should return 401 if user is not authenticated', async () => {
            const response = await request(app.getHttpServer())
                .patch('/orders/some-id/cancel');
            expect(response.status).toBe(401);
        });

        it('should cancel a pending order', async () => {
            mockCartClient.getCart.mockResolvedValue(validCart);
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            mockCartClient.clearCart.mockResolvedValue(undefined);
            mockRabbitMQService.publish.mockResolvedValue(undefined);

            const checkoutRes = await request(app.getHttpServer())
                .post('/orders/checkout')
                .set('Authorization', `Bearer ${userToken}`);

            const orderId = checkoutRes.body.id;

            const response = await request(app.getHttpServer())
                .patch(`/orders/${orderId}/cancel`)
                .set('Authorization', `Bearer ${userToken}`);
            expect(response.status).toBe(200);
            expect(response.body.status).toBe('CANCELLED');
        });

        it('should return 404 for non-existing order', async () => {
            const response = await request(app.getHttpServer())
                .patch('/orders/00000000-0000-0000-0000-000000000000/cancel')
                .set('Authorization', `Bearer ${userToken}`);
            expect(response.status).toBe(404);
        });
    });
});