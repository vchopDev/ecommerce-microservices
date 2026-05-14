import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { RabbitMQService } from "./rabbitmq.service";
import { ProductsService } from "../products/products.service";

interface OrderPlacedItem {
    productId: string;
    quantity: number;
}

interface OrderPlacedMessage {
    orderId: string;
    userId: string;
    items: OrderPlacedItem[];
}

@Injectable()
export class RabbitMQConsumer implements OnModuleInit {
    private readonly logger = new Logger(RabbitMQConsumer.name);

    constructor(
        private readonly rabbitMQService: RabbitMQService,
        private readonly productService: ProductsService,
    ) { }

    async onModuleInit() {
        await this.rabbitMQService.consume('ecommerce', 'order.placed', 'catalog.order.placed', this.handleOrderPlaced.bind(this));
        this.logger.log('Catalog Service RabbitMQ Consumer initialized');
    }

    private async handleOrderPlaced(message: OrderPlacedMessage) {
        this.logger.log(`Processing order placed message: ${message.orderId}`);
        try {
            for (const item of message.items) {
                await this.productService.decrementStock(item.productId, item.quantity);
            }
            this.logger.log(`Order placed message processed: ${message.orderId}`);
        } catch (error) {
            this.logger.error(`Error processing order placed message: ${message.orderId} - ${error}`);
        }
    }

}