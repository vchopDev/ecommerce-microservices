import { Controller, Post, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {

    constructor(
        private readonly ordersService: OrdersService
    ) { }

    @Post('checkout')
    async checkout(@Req() req: any) {
        return this.ordersService.checkout(req.user.sub);
    }

    @Get()
    async findAll(@Req() req: any) {
        return this.ordersService.findAllByUser(req.user.sub);
    }

    @Get(':id')
    async findOne(@Req() req: any, @Param('id') id: string) {
        return this.ordersService.findOneByUser(req.user.sub, id);
    }

    @Patch(':id/cancel')
    async cancel(@Req() req: any, @Param('id') id: string) {
        return this.ordersService.cancel(req.user.sub, id);
    }
}
