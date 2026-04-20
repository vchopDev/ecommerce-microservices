import { INestApplication } from '@nestjs/common';
import { createTestApp } from '../helpers/app.helper';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../../src/categories/schemas/category.schema';
import request from 'supertest';

describe('Categories (e2e)', () => {
    let app: INestApplication;
    let categoryModel: Model<any>;
    let adminToken: string;
    let userToken: string;
    let generateToken: (role: 'USER' | 'ADMIN') => string;


    beforeAll(async () => {
        ({ app, generateToken } = await createTestApp());
        categoryModel = app.get(getModelToken(Category.name));
        adminToken = generateToken('ADMIN');
        userToken = generateToken('USER');
    });

    beforeEach(async () => {
        await categoryModel.deleteMany({});
    });

    afterAll(async () => {
        await categoryModel.deleteMany({});
        await app.close();
    });

    describe('POST /categories', () => {
        it('should return 401 if no token provided', async () => {
            await request(app.getHttpServer())
                .post('/categories')
                .send({ name: 'Electronics' })
                .expect(401);
        });

        it('should return 403 if user is not admin', async () => {
            await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Electronics' })
                .expect(403);
        });

        it('should create a category if admin', async () => {
            const response = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Electronics', description: 'Electronic devices' })
                .expect(201);

            expect(response.body.name).toBe('Electronics');
            expect(response.body._id).toBeDefined();
        });

        it('should return 409 if name already exists', async () => {
            await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Electronics' });

            await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Electronics' })
                .expect(409);
        });

        it('should return 400 if name is missing', async () => {
            await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);
        });
    });

    describe('GET /categories', () => {
        it('should return all categories without auth', async () => {
            const response = await request(app.getHttpServer())
                .get('/categories')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('GET /categories/:id', () => {
        it('should return a category by id', async () => {
            const created = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Electronics' });

            const response = await request(app.getHttpServer())
                .get(`/categories/${created.body._id}`)
                .expect(200);

            expect(response.body.name).toBe('Electronics');
        });

        it('should return 404 if not found', async () => {
            await request(app.getHttpServer())
                .get('/categories/507f1f77bcf86cd799439011')
                .expect(404);
        });
    });

    describe('PATCH /categories/:id', () => {
        it('should return 403 if user is not admin', async () => {
            await request(app.getHttpServer())
                .patch('/categories/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ description: 'Updated' })
                .expect(403);
        });

        it('should update a category if admin', async () => {
            const created = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Electronics' });

            const response = await request(app.getHttpServer())
                .patch(`/categories/${created.body._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ description: 'Updated description' })
                .expect(200);

            expect(response.body.description).toBe('Updated description');
        });
    });

    describe('DELETE /categories/:id', () => {
        it('should return 403 if user is not admin', async () => {
            await request(app.getHttpServer())
                .delete('/categories/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
        });

        it('should delete a category if admin', async () => {
            const created = await request(app.getHttpServer())
                .post('/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'Electronics' });

            await request(app.getHttpServer())
                .delete(`/categories/${created.body._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(204);
        });

        it('should return 404 if not found', async () => {
            await request(app.getHttpServer())
                .delete('/categories/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
        });
    });
});