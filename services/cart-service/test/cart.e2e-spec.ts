import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../src/redis/redis.module';
import { createTestApp, mockCatalogClient } from './helpers/app.helper';

const validProduct = {
    id: '69e4f741f24991f82df76d8c',
    name: 'MacBook Pro 16',
    price: 2499.99,
    stock: 10,
    isActive: true,
};

describe('Cart Service (e2e)', () => {
    let app: INestApplication;
    let redisClient: Redis;
    let userToken: string;
    let adminToken: string;
    let generateToken: (role: 'USER' | 'ADMIN') => string;

    const userId = '06404c10-c45c-4565-828d-b4bb5c11738e';
    const realProductId = '69e4f741f24991f82df76d8c';

    beforeAll(async () => {
        ({ app, generateToken } = await createTestApp());
        redisClient = app.get(REDIS_CLIENT);
        userToken = generateToken('USER');
        adminToken = generateToken('ADMIN');
    });

    beforeEach(async () => {
        await redisClient.del(`cart:${userId}`);
        mockCatalogClient.getProduct.mockReset();
    });

    afterAll(async () => {
        await redisClient.del(`cart:${userId}`);
        await app.close();
    });

    // ─── GET /cart ─────────────────────────────────────────────────────────────

    describe('GET /cart', () => {
        it('should return 401 without token', () => {
            return request(app.getHttpServer())
                .get('/cart')
                .expect(401);
        });

        it('should return empty cart for new user', () => {
            return request(app.getHttpServer())
                .get('/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.userId).toBe(userId);
                    expect(res.body.items).toEqual([]);
                });
        });
    });

    // ─── POST /cart/items ──────────────────────────────────────────────────────

    describe('POST /cart/items', () => {
        it('should return 401 without token', () => {
            return request(app.getHttpServer())
                .post('/cart/items')
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 })
                .expect(401);
        });

        it('should reject a non-existing product', () => {
            mockCatalogClient.getProduct.mockResolvedValue(null);
            return request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: '000000000000000000000000', name: 'Fake', price: 9.99, quantity: 1 })
                .expect(400);
        });

        it('should reject an out of stock product', () => {
            mockCatalogClient.getProduct.mockResolvedValue({ ...validProduct, stock: 0 });
            return request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 })
                .expect(400);
        });

        it('should reject an inactive product', () => {
            mockCatalogClient.getProduct.mockResolvedValue({ ...validProduct, isActive: false });
            return request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 })
                .expect(400);
        });

        it('should reject invalid payload', () => {
            return request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: '', name: '', price: -1, quantity: 0 })
                .expect(400);
        });

        it('should add a valid product to the cart', () => {
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            return request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 })
                .expect(201)
                .expect((res) => {
                    expect(res.body.userId).toBe(userId);
                    expect(res.body.items).toHaveLength(1);
                    expect(res.body.items[0].productId).toBe(realProductId);
                    expect(res.body.items[0].quantity).toBe(1);
                    expect(res.body.items[0].price).toBe(2499.99);
                });
        });

        it('should increment quantity if product already in cart', async () => {
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            await request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 });

            return request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 })
                .expect(201)
                .expect((res) => {
                    expect(res.body.items[0].quantity).toBe(2);
                });
        });
    });

    // ─── PATCH /cart/items/:productId ──────────────────────────────────────────

    describe('PATCH /cart/items/:productId', () => {
        beforeEach(async () => {
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            await request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 });
        });

        it('should update item quantity', () => {
            return request(app.getHttpServer())
                .patch(`/cart/items/${realProductId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 5 })
                .expect(200)
                .expect((res) => {
                    expect(res.body.items[0].quantity).toBe(5);
                });
        });

        it('should return 404 for item not in cart', () => {
            return request(app.getHttpServer())
                .patch('/cart/items/000000000000000000000000')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ quantity: 1 })
                .expect(404);
        });
    });

    // ─── DELETE /cart/items/:productId ─────────────────────────────────────────

    describe('DELETE /cart/items/:productId', () => {
        beforeEach(async () => {
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            await request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 });
        });

        it('should remove item from cart', () => {
            return request(app.getHttpServer())
                .delete(`/cart/items/${realProductId}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.items).toHaveLength(0);
                });
        });

        it('should return 404 for item not in cart', () => {
            return request(app.getHttpServer())
                .delete('/cart/items/000000000000000000000000')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
        });
    });

    // ─── DELETE /cart ──────────────────────────────────────────────────────────

    describe('DELETE /cart', () => {
        beforeEach(async () => {
            mockCatalogClient.getProduct.mockResolvedValue(validProduct);
            await request(app.getHttpServer())
                .post('/cart/items')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ productId: realProductId, name: 'MacBook Pro 16', price: 2499.99, quantity: 1 });
        });

        it('should return 401 without token', () => {
            return request(app.getHttpServer())
                .delete('/cart')
                .expect(401);
        });

        it('should clear the entire cart', () => {
            return request(app.getHttpServer())
                .delete('/cart')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
        });
    });
});