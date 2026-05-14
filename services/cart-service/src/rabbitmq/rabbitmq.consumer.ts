import { Injectable, OnModuleInit, Logger, Inject } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.module";
import { Cart } from "../cart/interfaces/cart.interface";


interface ProductOutOfStockMessage {
    productId: string;
    name: string;
}

interface ProductPriceChangedMessage {
    productId: string;
    name: string;
    newPrice: number;
    oldPrice: number;
}


@Injectable()
export class RabbitMQConsumer implements OnModuleInit {
    private readonly logger = new Logger(RabbitMQConsumer.name);
    private readonly ttl: number;

    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly configService: ConfigService,
        @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    ) {
        this.ttl = this.configService.get<number>('CART_TTL', 2592000);
    }

    async onModuleInit() {
        this.logger.log('RabbitMQ Consumer initialized');
        this.rabbitMQService.consume(
            'ecommerce',
            'product.out.of.stock',
            'cart.product.out.of.stock',
            this.handleProductOutOfStock.bind(this)
        );
        this.rabbitMQService.consume(
            'ecommerce',
            'product.price.changed',
            'cart.product.price.changed',
            this.handleProductPriceChanged.bind(this)
        );
    }

    async handleProductOutOfStock(message: ProductOutOfStockMessage) {
        this.logger.log(`Handling product out of stock message: ${JSON.stringify(message)}`);

        try {
            await this.scanAndUpdateCarts(message.productId, (item) => {
                item.outOfStock = true;
            });

        } catch (error) {
            this.logger.error(`Failed to process out of stock for ${message.productId}:`, error);
        }

    }

    async handleProductPriceChanged(message: ProductPriceChangedMessage) {
        this.logger.log(`Handling product price changed message: ${JSON.stringify(message)}`);

        try {
            await this.scanAndUpdateCarts(message.productId, (item) => {
                item.price = message.newPrice;
                item.priceChanged = true;
            });

        } catch (error) {
            this.logger.error(`Failed to process price changed for ${message.productId}:`, error);
        }
    }


    private async scanAndUpdateCarts(productId: string, updateFn: (item: any) => void) {
        let cursor = '0';

        do {
            const [nextCursor, keys] = await this.redisClient.scan(
                cursor,
                'MATCH',
                'cart:*',
                'COUNT',
                1000
            );
            cursor = nextCursor;

            for (const key of keys) {
                try {
                    const raw = await this.redisClient.get(key);
                    if (!raw) continue;

                    const cart: Cart = JSON.parse(raw);

                    const item = cart.items.find(i => i.productId === productId);

                    updateFn(item);

                    cart.updatedAt = new Date().toISOString();

                    await this.redisClient.set(key, JSON.stringify(cart), 'KEEPTTL');

                } catch (error) {
                    this.logger.error(`Failed to process cart ${key}:`, error);
                }
            }
        } while (cursor !== '0');
    }

}