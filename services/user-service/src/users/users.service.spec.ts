import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
    user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};

const mockUser = {
    id: 'uuid-123',
    email: 'victor@test.com',
    password: 'hashedpassword',
    name: 'Victor',
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe('UsersService', () => {
    let usersService: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        usersService = module.get<UsersService>(UsersService);
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create and return a user', async () => {
            mockPrismaService.user.create.mockResolvedValue(mockUser);

            const result = await usersService.create({
                email: 'victor@test.com',
                password: 'hashedpassword',
                name: 'Victor',
            });

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.user.create).toHaveBeenCalledWith({
                data: { email: 'victor@test.com', password: 'hashedpassword', name: 'Victor' },
            });
        });

        it('should throw if email already exists', async () => {
            mockPrismaService.user.create.mockRejectedValue(
                new Error('Unique constraint failed'),
            );

            await expect(
                usersService.create({
                    email: 'victor@test.com',
                    password: 'hashedpassword',
                    name: 'Victor',
                }),
            ).rejects.toThrow('Unique constraint failed');
        });
    });

    describe('findByEmail', () => {
        it('should return a user by email', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await usersService.findByEmail('victor@test.com');

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { email: 'victor@test.com' },
            });
        });

        it('should return null if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await usersService.findByEmail('ghost@test.com');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should return a user by id', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

            const result = await usersService.findById('uuid-123');

            expect(result).toEqual(mockUser);
            expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
                where: { id: 'uuid-123' },
            });
        });

        it('should return null if user not found', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null);

            const result = await usersService.findById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update and return the user', async () => {
            const updated = { ...mockUser, name: 'Victor Updated' };
            mockPrismaService.user.update.mockResolvedValue(updated);

            const result = await usersService.update('uuid-123', { name: 'Victor Updated' });

            expect(result.name).toBe('Victor Updated');
            expect(mockPrismaService.user.update).toHaveBeenCalledWith({
                where: { id: 'uuid-123' },
                data: { name: 'Victor Updated' },
            });
        });

        it('should throw if user does not exist', async () => {
            mockPrismaService.user.update.mockRejectedValue(new Error('Record not found'));

            await expect(
                usersService.update('nonexistent-id', { name: 'Victor' }),
            ).rejects.toThrow('Record not found');
        });
    });
});