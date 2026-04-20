import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({
    timestamps: true,
    toJSON: {
        transform: (_: any, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        },
    },
})
export class Product {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ trim: true })
    description?: string;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ required: true, min: 0, default: 0 })
    stock: number;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    primaryCategoryId: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
    categoryIds: Types.ObjectId[];

    @Prop({ default: true })
    isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);