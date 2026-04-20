import { IsString, IsNumber, IsMongoId, IsOptional, IsArray, IsBoolean, MinLength, Min } from 'class-validator';

export class UpdateProductDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    stock?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    images?: string[];

    @IsOptional()
    @IsMongoId()
    primaryCategoryId?: string;

    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    categoryIds?: string[];

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}