import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../helpers/app.helper';
import request from 'supertest';

describe('GET /users/me (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let token: string;

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp());
        await prisma.user.deleteMany();
    });

    beforeEach(async () => {
        await prisma.user.deleteMany();
        const response = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'victor@test.com', password: 'password123', name: 'Victor' });
        token = response.body.access_token;
    });

    afterAll(async () => {
        await prisma.user.deleteMany();
        await app.close();
    });

    it('should return current user profile without password', async () => {
        const response = await request(app.getHttpServer())
            .get('/users/me')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(response.body.email).toBe('victor@test.com');
        expect(response.body.name).toBe('Victor');
        expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 if no token provided', async () => {
        await request(app.getHttpServer())
            .get('/users/me')
            .expect(401);
    });

    it('should return 401 if token is invalid', async () => {
        await request(app.getHttpServer())
            .get('/users/me')
            .set('Authorization', 'Bearer invalidtoken')
            .expect(401);
    });
});