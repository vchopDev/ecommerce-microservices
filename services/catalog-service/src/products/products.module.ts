import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { CategoriesModule } from '../categories/categories.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
    ]),
    CategoriesModule,
    AuthModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule { }