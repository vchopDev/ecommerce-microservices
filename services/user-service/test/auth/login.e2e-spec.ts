import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../helpers/app.helper';
import request from 'supertest';

describe('POST /auth/login (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        ({ app, prisma } = await createTestApp());
        await prisma.user.deleteMany();
    });

    beforeEach(async () => {
        await prisma.user.deleteMany();
        await request(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'victor@test.com', password: 'password123', name: 'Victor' });
    });

    afterAll(async () => {
        await prisma.user.deleteMany();
        await app.close();
    });

    it('should login and return 200 with token', async () => {
        const response = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'victor@test.com', password: 'password123' })
            .expect(200);

        expect(response.body.access_token).toBeDefined();
        expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 if password is wrong', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'victor@test.com', password: 'wrongpassword' })
            .expect(401);
    });

    it('should return 401 if user does not exist', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'ghost@test.com', password: 'password123' })
            .expect(401);
    });

    it('should return 400 if fields are missing', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send({})
            .expect(400);
    });
});