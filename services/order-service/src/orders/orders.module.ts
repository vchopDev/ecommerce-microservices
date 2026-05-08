import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CART_CLIENT } from '../cart/cart-client.interface';
import { HttpCartClient } from '../cart/cart-client';
import { CATALOG_CLIENT } from '../catalog/catalog-client.interface';
import { HttpCatalogClient } from '../catalog/catalog-client';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    RabbitMQModule
  ],
  controllers: [OrdersController],
  providers: [OrdersService,
    {
      provide: CART_CLIENT,
      useClass: HttpCartClient
    },
    {
      provide: CATALOG_CLIENT,
      useClass: HttpCatalogClient
    }
  ]
})
export class OrdersModule { }
