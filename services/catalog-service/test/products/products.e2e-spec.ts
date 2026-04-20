import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../../src/categories/schemas/category.schema';
import { Product } from '../../src/products/schemas/product.schema';
import request from 'supertest';

describe('Products (e2e)', () => {
    let app: INestApplication;
    let categoryModel: Model<any>;
    let productModel: Model<any>;
    let adminToken: string;
    let userToken: string;
    let generateToken: (role: 'USER' | 'ADMIN') => string;
    let categoryId: string;

    beforeAll(async () => {
        ({ app, generateToken } = await createTestApp());
        categoryModel = app.get(getModelToken(Category.name));
        productModel = app.get(getModelToken(Product.name));
        adminToken = generateToken('ADMIN');
        userToken = generateToken('USER');
    }, 30000);

    beforeEach(async () => {
        await productModel.deleteMany({});
        await categoryModel.deleteMany({});

        const category = await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Electronics', description: 'Electronic devices' });

        categoryId = category.body._id;
    });

    afterAll(async () => {
        await productModel.deleteMany({});
        await categoryModel.deleteMany({});
        await app.close();
    });

    describe('POST /products', () => {
        it('should return 401 if no token provided', async () => {
            await request(app.getHttpServer())
                .post('/products')
                .send({ name: 'MacBook Pro', price: 2499.99, stock: 10, primaryCategoryId: categoryId })
                .expect(401);
        });

        it('should return 403 if user is not admin', async () => {
            await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'MacBook Pro', price: 2499.99, stock: 10, primaryCategoryId: categoryId })
                .expect(403);
        });

        it('should create a product if admin', async () => {
            const response = await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'MacBook Pro',
                    description: 'Apple MacBook Pro',
                    price: 2499.99,
                    stock: 10,
                    primaryCategoryId: categoryId,
                })
                .expect(201);

            expect(response.body.name).toBe('MacBook Pro');
            expect(response.body._id).toBeDefined();
        });

        it('should return 400 if primaryCategoryId does not exist', async () => {
            await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'MacBook Pro',
                    price: 2499.99,
                    stock: 10,
                    primaryCategoryId: '507f1f77bcf86cd799439011',
                })
                .expect(400);
        });

        it('should return 400 if required fields are missing', async () => {
            await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);
        });

        it('should return 400 if price is negative', async () => {
            await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'MacBook Pro',
                    price: -100,
                    stock: 10,
                    primaryCategoryId: categoryId,
                })
                .expect(400);
        });
    });

    describe('GET /products', () => {
        beforeEach(async () => {
            await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'MacBook Pro',
                    price: 2499.99,
                    stock: 10,
                    primaryCategoryId: categoryId,
                });
        });

        it('should return paginated products without auth', async () => {
            const response = await request(app.getHttpServer())
                .get('/products')
                .expect(200);

            expect(response.body.data).toBeDefined();
            expect(response.body.total).toBeDefined();
            expect(response.body.page).toBeDefined();
        });

        it('should filter by categoryId', async () => {
            const response = await request(app.getHttpServer())
                .get(`/products?categoryId=${categoryId}`)
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should filter by price range', async () => {
            const response = await request(app.getHttpServer())
                .get('/products?minPrice=1000&maxPrice=3000')
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
        });

        it('should filter inStock products', async () => {
            const response = await request(app.getHttpServer())
                .get('/products?inStock=true')
                .expect(200);

            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('GET /products/:id', () => {
        it('should return a product by id', async () => {
            const created = await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'MacBook Pro',
                    price: 2499.99,
                    stock: 10,
                    primaryCategoryId: categoryId,
                });

            const response = await request(app.getHttpServer())
                .get(`/products/${created.body._id}`)
                .expect(200);

            expect(response.body.name).toBe('MacBook Pro');
        });

        it('should return 404 if not found', async () => {
            await request(app.getHttpServer())
                .get('/products/507f1f77bcf86cd799439011')
                .expect(404);
        });
    });

    describe('PATCH /products/:id', () => {
        it('should return 403 if user is not admin', async () => {
            await request(app.getHttpServer())
                .patch('/products/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ price: 1999.99 })
                .expect(403);
        });

        it('should update a product if admin', async () => {
            const created = await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'MacBook Pro',
                    price: 2499.99,
                    stock: 10,
                    primaryCategoryId: categoryId,
                });

            const response = await request(app.getHttpServer())
                .patch(`/products/${created.body._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ price: 1999.99 })
                .expect(200);

            expect(response.body.price).toBe(1999.99);
        });
    });

    describe('DELETE /products/:id', () => {
        it('should return 403 if user is not admin', async () => {
            await request(app.getHttpServer())
                .delete('/products/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should delete a product if admin', async () => {
            const created = await request(app.getHttpServer())
                .post('/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'MacBook Pro',
                    price: 2499.99,
                    stock: 10,
                    primaryCategoryId: categoryId,
                });

            await request(app.getHttpServer())
                .delete(`/products/${created.body._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204);
        });

        it('should return 404 if not found', async () => {
            await request(app.getHttpServer())
                .delete('/products/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });
});