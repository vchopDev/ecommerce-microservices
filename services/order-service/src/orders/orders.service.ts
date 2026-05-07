import { Injectable, NotFoundException, BadRequestException, Inject, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../generated/prisma';
import { CART_CLIENT, type CartClient, type CartItem } from '../cart/cart-client.interface';
import { CATALOG_CLIENT, type CatalogClient } from '../catalog/catalog-client.interface';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class OrdersService {
    constructor(
        @Inject(CART_CLIENT)
        private readonly cartClient: CartClient,
        @Inject(CATALOG_CLIENT)
        private readonly catalogClient: CatalogClient,
        private readonly prisma: PrismaService,
        private readonly rabbitMQService: RabbitMQService,
    ) { }




    async checkout(userId: string) {
        const cart = await this.cartClient.getCart(userId);

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        const validatedItems: {
            productId: string;
            name: string;
            price: number;
            quantity: number;
            imageUrl?: string;
        }[] = [];
        let totalPrice = 0;

        for (const item of cart.items) {
            const product = await this.catalogClient.getProduct(item.productId);

            if (!product || !product.isActive || product.stock < item.quantity) {
                throw new BadRequestException(`Product ${item.productId} is not available`);
            }

            totalPrice += product.price * item.quantity;
            validatedItems.push({
                ...item,
                price: product.price
            });
        }

        const order = await this.prisma.order.create({
            data: {
                userId,
                items: {
                    create: validatedItems
                },
                totalPrice
            },
            include: { items: true },
        });

        await this.cartClient.clearCart(userId);


        await this.rabbitMQService.publish(
            'ecommerce',
            'order.placed',
            {
                id: order.id,
                userId: order.userId,
                totalPrice: order.totalPrice,
                items: order.items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                })),
                status: order.status,
                createdAt: order.createdAt,
            }
        );

        return order;
    }

    async findAllByUser(userId: string) {
        return this.prisma.order.findMany({
            where: { userId },
            include: {
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findOneByUser(userId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId, userId },
            include: {
                items: true
            }
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return order;
    }

    async cancel(userId: string, orderId: string) {
        try {
            const cancelledOrder = await this.prisma.order.update({
                where: { id: orderId, userId, status: OrderStatus.PENDING },
                data: {
                    status: OrderStatus.CANCELLED
                },
                include: { items: true },
            });

            await this.rabbitMQService.publish(
                'ecommerce',
                'order.cancelled',
                {
                    orderId: cancelledOrder.id,
                    userId: cancelledOrder.userId,
                    totalPrice: cancelledOrder.totalPrice,
                    items: cancelledOrder.items.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    })),
                }
            );
            return cancelledOrder;
        } catch (error) {
            if (error.code === 'P2025') {
                throw new NotFoundException('Order not found or cannot be cancelled');
            }
            throw new InternalServerErrorException('Failed to cancel order');
        }
    }
}
