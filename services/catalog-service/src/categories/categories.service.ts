import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
    constructor(
        @InjectModel(Category.name)
        private readonly categoryModel: Model<CategoryDocument>,
    ) { }

    async create(dto: CreateCategoryDto): Promise<Category> {
        const existing = await this.categoryModel.findOne({ name: dto.name });
        if (existing) {
            throw new ConflictException('Category name already exists');
        }
        const category = new this.categoryModel(dto);
        return category.save();
    }

    async findAll(): Promise<Category[]> {
        return this.categoryModel.find().exec();
    }

    async findById(id: string): Promise<Category> {
        const category = await this.categoryModel
            .findById(id)
            .populate('parentId')
            .exec();
        if (!category) {
            throw new NotFoundException(`Category ${id} not found`);
        }
        return category;
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
        if (dto.name) {
            const existing = await this.categoryModel.findOne({
                name: dto.name,
                _id: { $ne: id },
            });
            if (existing) {
                throw new ConflictException('Category name already exists');
            }
        }

        const category = await this.categoryModel
            .findByIdAndUpdate(id, dto, { new: true })
            .populate('parentId')
            .exec();

        if (!category) {
            throw new NotFoundException(`Category ${id} not found`);
        }
        return category;
    }

    async remove(id: string): Promise<void> {
        const result = await this.categoryModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Category ${id} not found`);
        }
    }

    async exists(id: string): Promise<boolean> {
        const category = await this.categoryModel.findById(id).exec();
        return !!category;
    }
}