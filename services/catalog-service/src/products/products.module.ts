import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { CategoriesModule } from '../categories/categories.module';
import { AuthModule } from '../auth/auth.module';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';
import { RabbitMQConsumer } from '../rabbitmq/rabbitmq.consumer';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
    CategoriesModule,
    AuthModule,
    RabbitMQModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, RabbitMQConsumer],
})
export class ProductsModule { }