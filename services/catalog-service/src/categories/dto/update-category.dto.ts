import { IsString, IsMongoId, IsOptional, MinLength } from 'class-validator';

export class UpdateCategoryDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsMongoId()
    parentId?: string;
}