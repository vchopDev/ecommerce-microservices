import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CartService } from './cart.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { CATALOG_CLIENT } from '../catalog/catalog-client.interface';

const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
};

const mockCatalogClient = {
    getProduct: jest.fn(),
};

const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
            CART_TTL_SECONDS: 2592000,
        };
        return config[key] ?? defaultValue;
    }),
};

describe('CartService', () => {
    let service: CartService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CartService,
                { provide: REDIS_CLIENT, useValue: mockRedis },
                { provide: CATALOG_CLIENT, useValue: mockCatalogClient },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<CartService>(CartService);
        jest.clearAllMocks();
    });

    // ─── getCart ───────────────────────────────────────────────────────────────

    describe('getCart', () => {
        it('should return empty cart if no data in Redis', async () => {
            mockRedis.get.mockResolvedValue(null);
            const cart = await service.getCart('user-1');
            expect(cart).toMatchObject({ userId: 'user-1', items: [] });
        });

        it('should return parsed cart from Redis', async () => {
            const stored = { userId: 'user-1', items: [{ productId: 'p1', name: 'Test', price: 10, quantity: 1 }], updatedAt: new Date().toISOString() };
            mockRedis.get.mockResolvedValue(JSON.stringify(stored));
            const cart = await service.getCart('user-1');
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].productId).toBe('p1');
        });
    });

    // ─── addItem ───────────────────────────────────────────────────────────────

    describe('addItem', () => {
        const dto = { productId: 'p1', name: 'MacBook', price: 2499.99, quantity: 1 };

        beforeEach(() => {
            mockCatalogClient.getProduct.mockResolvedValue({ id: 'p1', name: 'MacBook', price: 2499.99, stock: 10, isActive: true });
        });

        it('should add a new item to an empty cart', async () => {
            mockRedis.get.mockResolvedValue(null);
            mockRedis.set.mockResolvedValue('OK');
            const cart = await service.addItem('user-1', dto);
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].price).toBe(2499.99);
        });

        it('should increment quantity if item already exists', async () => {
            const existing = { userId: 'user-1', items: [{ productId: 'p1', name: 'MacBook', price: 2499.99, quantity: 1 }], updatedAt: new Date().toISOString() };
            mockRedis.get.mockResolvedValue(JSON.stringify(existing));
            mockRedis.set.mockResolvedValue('OK');
            const cart = await service.addItem('user-1', dto);
            expect(cart.items[0].quantity).toBe(2);
        });

        it('should throw BadRequestException if product does not exist', async () => {
            mockCatalogClient.getProduct.mockResolvedValue(null);
            await expect(service.addItem('user-1', dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if product is out of stock', async () => {
            mockCatalogClient.getProduct.mockResolvedValue({ id: 'p1', stock: 0, isActive: true });
            await expect(service.addItem('user-1', dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if product is not active', async () => {
            mockCatalogClient.getProduct.mockResolvedValue({ id: 'p1', stock: 10, isActive: false });
            await expect(service.addItem('user-1', dto)).rejects.toThrow(BadRequestException);
        });

        it('should throw InternalServerErrorException if catalog is unavailable', async () => {
            mockCatalogClient.getProduct.mockRejectedValue(new Error('ECONNREFUSED'));
            await expect(service.addItem('user-1', dto)).rejects.toThrow(InternalServerErrorException);
        });
    });

    // ─── updateItem ────────────────────────────────────────────────────────────

    describe('updateItem', () => {
        it('should update item quantity', async () => {
            const existing = { userId: 'user-1', items: [{ productId: 'p1', name: 'MacBook', price: 2499.99, quantity: 1 }], updatedAt: new Date().toISOString() };
            mockRedis.get.mockResolvedValue(JSON.stringify(existing));
            mockRedis.set.mockResolvedValue('OK');
            const cart = await service.updateItem('user-1', 'p1', { quantity: 5 });
            expect(cart.items[0].quantity).toBe(5);
        });

        it('should throw NotFoundException if item not in cart', async () => {
            mockRedis.get.mockResolvedValue(null);
            await expect(service.updateItem('user-1', 'p999', { quantity: 1 })).rejects.toThrow(NotFoundException);
        });
    });

    // ─── removeItem ────────────────────────────────────────────────────────────

    describe('removeItem', () => {
        it('should remove item from cart', async () => {
            const existing = { userId: 'user-1', items: [{ productId: 'p1', name: 'MacBook', price: 2499.99, quantity: 1 }], updatedAt: new Date().toISOString() };
            mockRedis.get.mockResolvedValue(JSON.stringify(existing));
            mockRedis.set.mockResolvedValue('OK');
            const cart = await service.removeItem('user-1', 'p1');
            expect(cart.items).toHaveLength(0);
        });

        it('should throw NotFoundException if item not in cart', async () => {
            mockRedis.get.mockResolvedValue(null);
            await expect(service.removeItem('user-1', 'p999')).rejects.toThrow(NotFoundException);
        });
    });

    // ─── clearCart ─────────────────────────────────────────────────────────────

    describe('clearCart', () => {
        it('should delete the cart key from Redis', async () => {
            mockRedis.del.mockResolvedValue(1);
            await service.clearCart('user-1');
            expect(mockRedis.del).toHaveBeenCalledWith('cart:user-1');
        });
    });
});