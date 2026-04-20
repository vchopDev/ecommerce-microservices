import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/roles.enum';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Post()
    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateCategoryDto) {
        return this.categoriesService.create(dto);
    }

    @Get()
    findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoriesService.findById(id);
    }

    @Patch(':id')
    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.ADMIN)
    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoriesService.update(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}