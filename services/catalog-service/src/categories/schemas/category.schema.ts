import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
    @Prop({ required: true, unique: true, trim: true })
    name: string;

    @Prop({ trim: true })
    description?: string;

    @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
    parentId?: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);