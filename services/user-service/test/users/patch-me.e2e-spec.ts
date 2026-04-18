import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../helpers/app.helper';
import request from 'supertest';

describe('PATCH /users/me (e2e)', () => {
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

    it('should update name and return 200', async () => {
        const response = await request(app.getHttpServer())
            .patch('/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Victor Updated' })
            .expect(200);

        expect(response.body.name).toBe('Victor Updated');
        expect(response.body).not.toHaveProperty('password');
    });

    it('should return 200 with empty body — nothing changes', async () => {
        const response = await request(app.getHttpServer())
            .patch('/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({})
            .expect(200);

        expect(response.body.name).toBe('Victor');
    });

    it('should return 400 if name is too short', async () => {
        await request(app.getHttpServer())
            .patch('/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'V' })
            .expect(400);
    });

    it('should return 400 if unknown fields are sent', async () => {
        await request(app.getHttpServer())
            .patch('/users/me')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Victor Updated', role: 'admin' })
            .expect(400);
    });

    it('should return 401 if no token provided', async () => {
        await request(app.getHttpServer())
            .patch('/users/me')
            .send({ name: 'Victor Updated' })
            .expect(401);
    });

    it('should return 401 if token is invalid', async () => {
        await request(app.getHttpServer())
            .patch('/users/me')
            .set('Authorization', 'Bearer invalidtoken')
            .send({ name: 'Victor Updated' })
            .expect(401);
    });
});