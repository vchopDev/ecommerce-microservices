import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { AuthModule } from '../auth/auth.module';
import { CatalogModule } from '../catalog/catalog.module';

@Module({
  imports: [AuthModule, CatalogModule],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule { }