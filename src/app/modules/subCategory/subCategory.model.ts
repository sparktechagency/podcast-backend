import { model, Schema } from 'mongoose';
import { ISubCategory } from './subCategory.interface';

const SubCategorySchema = new Schema<ISubCategory>(
    {
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        name: { type: String, required: true, unique: true },
        category_image: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

const SubCategory = model<ISubCategory>('SubCategory', SubCategorySchema);

export default SubCategory;
