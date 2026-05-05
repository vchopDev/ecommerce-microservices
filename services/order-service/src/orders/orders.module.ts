import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CART_CLIENT } from 'src/cart/cart-client.interface';
import { HttpCartClient } from 'src/cart/cart-client';
import { CATALOG_CLIENT } from 'src/catalog/catalog-client.interface';
import { HttpCatalogClient } from 'src/catalog/catalog-client';

@Module({
  imports: [
    AuthModule,
    PrismaModule
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
