import { IsString, IsNumber, IsInt, IsPositive, IsOptional, IsUrl, MinLength } from 'class-validator';

export class AddItemDto {
    @IsString()
    @MinLength(1)
    productId: string;

    @IsString()
    @MinLength(1)
    name: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    price: number;

    @IsInt()
    @IsPositive()
    quantity: number;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;
}