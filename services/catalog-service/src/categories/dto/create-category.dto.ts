import { IsString, IsMongoId, IsOptional, MinLength } from 'class-validator';

export class CreateCategoryDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsMongoId()
    parentId?: string;
}