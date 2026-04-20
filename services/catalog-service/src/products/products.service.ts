import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name)
        private readonly productModel: Model<ProductDocument>,
        private readonly categoriesService: CategoriesService,
    ) { }

    async create(dto: CreateProductDto): Promise<Product> {
        const categoryExists = await this.categoriesService.exists(
            dto.primaryCategoryId,
        );
        if (!categoryExists) {
            throw new BadRequestException(
                `Category ${dto.primaryCategoryId} not found`,
            );
        }

        if (dto.categoryIds?.length) {
            for (const categoryId of dto.categoryIds) {
                const exists = await this.categoriesService.exists(categoryId);
                if (!exists) {
                    throw new BadRequestException(`Category ${categoryId} not found`);
                }
            }
        }

        const product = new this.productModel(dto);
        return product.save();
    }

    async findAll(query: {
        page?: number;
        limit?: number;
        categoryId?: string;
        minPrice?: number;
        maxPrice?: number;
        inStock?: boolean;
    }): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const skip = (page - 1) * limit;

        const filter: Record<string, any> = { isActive: true };

        if (query.categoryId) {
            filter.$or = [
                { primaryCategoryId: query.categoryId },
                { categoryIds: query.categoryId },
            ];
        }

        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            filter.price = {};
            if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
            if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
        }

        if (query.inStock) {
            filter.stock = { $gt: 0 };
        }

        const [data, total] = await Promise.all([
            this.productModel
                .find(filter)
                .populate('primaryCategoryId')
                .skip(skip)
                .limit(limit)
                .exec(),
            this.productModel.countDocuments(filter),
        ]);

        return { data, total, page, limit };
    }

    async findById(id: string): Promise<Product> {
        const product = await this.productModel
            .findById(id)
            .populate('primaryCategoryId')
            .populate('categoryIds')
            .exec();

        if (!product) {
            throw new NotFoundException(`Product ${id} not found`);
        }
        return product;
    }

    async update(id: string, dto: UpdateProductDto): Promise<Product> {
        if (dto.primaryCategoryId) {
            const exists = await this.categoriesService.exists(dto.primaryCategoryId);
            if (!exists) {
                throw new BadRequestException(
                    `Category ${dto.primaryCategoryId} not found`,
                );
            }
        }

        const product = await this.productModel
            .findByIdAndUpdate(id, dto, { returnDocument: 'after' })
            .populate('primaryCategoryId')
            .exec();

        if (!product) {
            throw new NotFoundException(`Product ${id} not found`);
        }
        return product;
    }

    async remove(id: string): Promise<void> {
        const result = await this.productModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Product ${id} not found`);
        }
    }
}