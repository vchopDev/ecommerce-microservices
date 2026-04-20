import { IsString, IsNumber, IsMongoId, IsOptional, IsArray, IsBoolean, MinLength, Min } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @Min(0)
    stock: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsMongoId()
    primaryCategoryId: string;

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    categoryIds?: string[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}