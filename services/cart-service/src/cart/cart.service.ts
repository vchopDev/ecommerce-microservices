import { BadRequestException, Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { Cart, CartItem } from './interfaces/cart.interface';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import type { CatalogClient } from '../catalog/catalog-client.interface';
import { CATALOG_CLIENT } from '../catalog/catalog-client.interface';


@Injectable()
export class CartService {
    private readonly ttl: number;

    constructor(
        @Inject(REDIS_CLIENT) private readonly redis: Redis,
        @Inject(CATALOG_CLIENT) private readonly catalogClient: CatalogClient,
        private readonly configService: ConfigService,
    ) {
        this.ttl = this.configService.get<number>('CART_TTL_SECONDS', 2592000);
    }

    private cartKey(userId: string): string {
        return `cart:${userId}`;
    }

    async getCart(userId: string): Promise<Cart> {
        const raw = await this.redis.get(this.cartKey(userId));
        if (!raw) {
            return { userId, items: [], updatedAt: new Date().toISOString() };
        }
        return JSON.parse(raw) as Cart;
    }


    private async validateProduct(productId: string): Promise<void> {
        try {
            const product = await this.catalogClient.getProduct(productId);

            if (!product) {
                throw new BadRequestException(`Product ${productId} does not exist`);
            }

            if (!product.isActive) {
                throw new BadRequestException(`Product ${productId} is not available`);
            }

            if (product.stock <= 0) {
                throw new BadRequestException(`Product ${productId} is out of stock`);
            }

        } catch (error) {
            if (
                error instanceof BadRequestException ||
                error instanceof InternalServerErrorException
            ) {
                throw error;
            }
            throw new InternalServerErrorException('Catalog service is unavailable');
        }
    }

    async addItem(userId: string, dto: AddItemDto): Promise<Cart> {
        await this.validateProduct(dto.productId);
        const cart = await this.getCart(userId);
        const existing = cart.items.find((i) => i.productId === dto.productId);

        if (existing) {
            existing.quantity += dto.quantity;
        } else {
            const newItem: CartItem = {
                productId: dto.productId,
                name: dto.name,
                price: dto.price,
                quantity: dto.quantity,
                imageUrl: dto.imageUrl,
            };
            cart.items.push(newItem);
        }

        return this.saveCart(userId, cart);
    }

    async updateItem(userId: string, productId: string, dto: UpdateItemDto): Promise<Cart> {
        const cart = await this.getCart(userId);
        const item = cart.items.find((i) => i.productId === productId);

        if (!item) {
            throw new NotFoundException(`Product ${productId} not found in cart`);
        }

        item.quantity = dto.quantity;
        return this.saveCart(userId, cart);
    }

    async removeItem(userId: string, productId: string): Promise<Cart> {
        const cart = await this.getCart(userId);
        const before = cart.items.length;
        cart.items = cart.items.filter((i) => i.productId !== productId);

        if (cart.items.length === before) {
            throw new NotFoundException(`Product ${productId} not found in cart`);
        }

        return this.saveCart(userId, cart);
    }

    async clearCart(userId: string): Promise<void> {
        await this.redis.del(this.cartKey(userId));
    }

    private async saveCart(userId: string, cart: Cart): Promise<Cart> {
        cart.updatedAt = new Date().toISOString();
        await this.redis.set(
            this.cartKey(userId),
            JSON.stringify(cart),
            'EX',
            this.ttl,
        );
        return cart;
    }
}