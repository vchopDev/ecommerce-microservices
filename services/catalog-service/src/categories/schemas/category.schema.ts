import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

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
export class Category {
    @Prop({ required: true, unique: true, trim: true })
    name: string;

    @Prop({ trim: true })
    description?: string;

    @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
    parentId?: Types.ObjectId;
}

export const CategorySchema = SchemaFactory.createForClass(Category);