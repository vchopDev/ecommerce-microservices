import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitMQService.name);
    private channel: amqplib.Channel;
    private connection: amqplib.ChannelModel;

    constructor(private readonly configService: ConfigService) { }

    async onModuleInit() {
        const url = this.configService.get<string>('RABBITMQ_URL') || 'amqp://guest:guest@localhost:5672';
        this.connection = await amqplib.connect(url);
        this.channel = await this.connection.createChannel();
        this.logger.log('RabbitMQ connected');
    }


    async publish(exchange: string, routingKey: string, message: any) {
        try {
            await this.channel?.assertExchange(exchange, 'topic', { durable: true });
            await this.channel?.publish(
                exchange,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                { persistent: true });

            this.logger.log(`Message sent to ${exchange} with routing key ${routingKey}`);
        } catch (error) {
            this.logger.error(`Error sending message to ${exchange}: ${error}`);
        }
    }

    async onModuleDestroy() {
        await this.channel?.close();
        await this.connection?.close();
        this.logger.log('RabbitMQ disconnected');
    }
}