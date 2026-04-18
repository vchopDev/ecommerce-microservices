import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../helpers/app.helper';
import request from 'supertest';

describe('POST /auth/register (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp());
        await prisma.user.deleteMany();
    });

    beforeEach(async () => {
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        await prisma.user.deleteMany();
        await app.close();
    });

    it('should register a new user and return 201', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'victor@test.com', password: 'password123', name: 'Victor' })
            .expect(201);

        expect(response.body.access_token).toBeDefined();
        expect(response.body.user.email).toBe('victor@test.com');
        expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 409 if email already exists', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'victor@test.com', password: 'password123', name: 'Victor' });

        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'victor@test.com', password: 'password123', name: 'Victor' })
            .expect(409);
    });

    it('should return 400 if email is invalid', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'not-an-email', password: 'password123', name: 'Victor' })
            .expect(400);
    });

    it('should return 400 if password is too short', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'victor@test.com', password: '123', name: 'Victor' })
            .expect(400);
    });

    it('should return 400 if fields are missing', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({})
            .expect(400);
    });

    it('should return 400 if unknown fields are sent', async () => {
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'victor@test.com', password: 'password123', name: 'Victor', role: 'admin' })
            .expect(400);
    });
});