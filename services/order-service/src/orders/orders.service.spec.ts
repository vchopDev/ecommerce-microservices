import { Test, TestingModule } from "@nestjs/testing"
import { OrdersService } from "./orders.service"
import { RabbitMQService } from "../rabbitmq/rabbitmq.service"
import { CART_CLIENT } from "../cart/cart-client.interface"
import { CATALOG_CLIENT } from "../catalog/catalog-client.interface"
import { PrismaService } from "../prisma/prisma.service"
import { BadRequestException, NotFoundException, InternalServerErrorException } from "@nestjs/common"

const mockPrisma = {
    order: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
    }
}

const mockCartClient = {
    getCart: jest.fn(),
    clearCart: jest.fn(),
}
const mockCatalogClient = {
    getProduct: jest.fn(),
}
const mockRabbitMQService = {
    publish: jest.fn(),
}

const mockCart = {
    userId: 'user-1',
    items: [
        { productId: 'p1', name: 'MacBook', price: 2499.99, quantity: 1 },
    ],
    updatedAt: new Date().toISOString(),
};

const mockProduct = {
    id: 'p1',
    name: 'MacBook',
    price: 2499.99,
    stock: 10,
    isActive: true,
};

const mockOrder = {
    id: 'order-1',
    userId: 'user-1',
    totalPrice: 2499.99,
    status: 'PENDING',
    paymentStatus: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
        { id: 'item-1', orderId: 'order-1', productId: 'p1', name: 'MacBook', price: 2499.99, quantity: 1, imageUrl: null },
    ],
};

describe('OrdersService', () => {
    let service: OrdersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: CART_CLIENT, useValue: mockCartClient },
                { provide: CATALOG_CLIENT, useValue: mockCatalogClient },
                { provide: PrismaService, useValue: mockPrisma },
                { provide: RabbitMQService, useValue: mockRabbitMQService },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
        jest.clearAllMocks();
    });


    describe("checkout", () => {
        it("should create an order and publish order.placed event", async () => {
            mockCartClient.getCart.mockResolvedValue(mockCart);
            mockCatalogClient.getProduct.mockResolvedValue(mockProduct);
            mockPrisma.order.create.mockResolvedValue(mockOrder);

            const result = await service.checkout('user-1');
            expect(result.status).toBe('PENDING');
            expect(mockRabbitMQService.publish).toHaveBeenCalledWith('ecommerce', 'order.placed',
                expect.objectContaining({
                    id: 'order-1',
                    userId: 'user-1',
                    totalPrice: 2499.99,
                    status: 'PENDING',
                    createdAt: expect.any(Date),
                    items: [
                        { productId: 'p1', name: 'MacBook', price: 2499.99, quantity: 1 }
                    ],
                })
            );
        });

        it("should throw bad request exception if the user has no cart", async () => {
            mockCartClient.getCart.mockResolvedValue(null);
            await expect(service.checkout("user-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw bad request exception if product does not exist", async () => {
            mockCartClient.getCart.mockResolvedValue(mockCart);
            mockCatalogClient.getProduct.mockResolvedValue(null);
            await expect(service.checkout("user-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw bad request exception if product is not active", async () => {
            mockCartClient.getCart.mockResolvedValue(mockCart);
            mockCatalogClient.getProduct.mockResolvedValue({ ...mockProduct, isActive: false });
            await expect(service.checkout("user-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw bad request exception if stock is insufficient", async () => {
            mockCartClient.getCart.mockResolvedValue(mockCart);
            mockCatalogClient.getProduct.mockResolvedValue({ ...mockProduct, stock: 0 });
            await expect(service.checkout("user-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw bad request exception if cart has one or more items out of stock", async () => {
            mockCartClient.getCart.mockResolvedValue({ ...mockCart, items: [mockCart.items[0], { ...mockCart.items[0], productId: 'p2' }] });
            mockCatalogClient.getProduct.mockResolvedValue({ ...mockProduct, stock: 0 });
            await expect(service.checkout("user-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw bad request exception if cart has one or more items not active", async () => {
            mockCartClient.getCart.mockResolvedValue({ ...mockCart, items: [mockCart.items[0], { ...mockCart.items[0], productId: 'p2' }] });
            mockCatalogClient.getProduct.mockResolvedValue({ ...mockProduct, isActive: false });
            await expect(service.checkout("user-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw bad request exception if quantity is greater than stock", async () => {
            mockCartClient.getCart.mockResolvedValue({ ...mockCart, items: [{ ...mockCart.items[0], quantity: 10 }] });
            mockCatalogClient.getProduct.mockResolvedValue({ ...mockProduct, stock: 5 });
            await expect(service.checkout("user-1")).rejects.toThrow(BadRequestException);
        });

        it("should throw bad request exception if cart is empty", async () => {
            mockCartClient.getCart.mockResolvedValue({ ...mockCart, items: [] });
            await expect(service.checkout("user-1")).rejects.toThrow(BadRequestException);
        });
    })

    describe("findOneByUser", () => {
        it("should return a single order", async () => {
            mockPrisma.order.findUnique.mockResolvedValue(mockCart);
            const result = await service.findOneByUser("user-1", "order-1");
            expect(result).toMatchObject(mockCart);
        });

        it("should throw not found exception if the order does not exist", async () => {
            mockPrisma.order.findUnique.mockResolvedValue(null);
            await expect(service.findOneByUser("user-1", "order-1")).rejects.toThrow(NotFoundException);
        });
    });

    describe("findAllByUser", () => {
        it("should return all orders for a user", async () => {
            mockPrisma.order.findMany.mockResolvedValue([mockCart, mockCart]);
            const result = await service.findAllByUser("user-1");
            expect(result).toHaveLength(2);
        });

        it("should return an empty array if the user has no orders", async () => {
            mockPrisma.order.findMany.mockResolvedValue([]);
            const result = await service.findAllByUser("user-1");
            expect(result).toHaveLength(0);
        });
    });


    describe('cancel', () => {
        it('should cancel an order and publish order.cancelled event', async () => {
            mockPrisma.order.update.mockResolvedValue({
                ...mockOrder,
                status: 'CANCELLED'
            });
            const result = await service.cancel('user-1', 'order-1');
            expect(result.status).toBe('CANCELLED');
            expect(mockRabbitMQService.publish).toHaveBeenCalledWith('ecommerce', 'order.cancelled',
                expect.objectContaining({
                    orderId: 'order-1',
                    userId: 'user-1',
                    totalPrice: 2499.99,
                })
            );
        });

        it('should throw NotFoundException if order not found or cannot be cancelled', async () => {
            mockPrisma.order.update.mockRejectedValue({ code: 'P2025' });
            await expect(service.cancel('user-1', 'order-1')).rejects.toThrow(NotFoundException);
        });

        it('should throw InternalServerErrorException on unknown errors', async () => {
            mockPrisma.order.update.mockRejectedValue(new Error('DB connection lost'));
            await expect(service.cancel('user-1', 'order-1')).rejects.toThrow(InternalServerErrorException);
        });
    });
});