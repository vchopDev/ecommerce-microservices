import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderStatus } from '../generated/prisma';
import { CART_CLIENT, type CartClient, type CartItem } from 'src/cart/cart-client.interface';
import { CATALOG_CLIENT, type CatalogClient } from 'src/catalog/catalog-client.interface';
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service';

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
        // TODO: CartClient — fetch cart
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

        // TODO: publish order.placed to RabbitMQ
        await this.rabbitMQService.publish(
            'ecommerce',
            'order.placed',
            {
                orderId: order.id,
                userId: order.userId,
                totalPrice: order.totalPrice,
                items: order.items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                })),
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
        const order = await this.prisma.order.findUnique({
            where: { id: orderId, userId },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Order cannot be cancelled');
        }

        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: OrderStatus.CANCELLED
            }
        });
    }
}
