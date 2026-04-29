import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtGuard)
@Controller('cart')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Req() req: any) {
        return this.cartService.getCart(req.user.sub);
    }

    @Post('items')
    addItem(@Req() req: any, @Body() dto: AddItemDto) {
        return this.cartService.addItem(req.user.sub, dto);
    }

    @Patch('items/:productId')
    updateItem(
        @Req() req: any,
        @Param('productId') productId: string,
        @Body() dto: UpdateItemDto,
    ) {
        return this.cartService.updateItem(req.user.sub, productId, dto);
    }

    @Delete('items/:productId')
    removeItem(@Req() req: any, @Param('productId') productId: string) {
        return this.cartService.removeItem(req.user.sub, productId);
    }

    @Delete()
    clearCart(@Req() req: any) {
        return this.cartService.clearCart(req.user.sub);
    }
}