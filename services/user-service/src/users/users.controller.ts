import { Controller, Get, Patch, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import type { User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    async getMe(@CurrentUser() user: User) {
        const { password, ...result } = user;
        return result;
    }

    @Patch('me')
    async patchMe(
        @CurrentUser() user: User,
        @Body() dto: UpdateUserDto,
    ) {
        const updated = await this.usersService.update(user.id, dto);
        const { password, ...result } = updated;
        return result;
    }
}