import { model, Schema } from 'mongoose';
import { ISubCategory } from './subCategory.interface';
import redis from '../../utilities/redisClient';

const SubCategorySchema = new Schema<ISubCategory>(
    {
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        name: { type: String, required: true, unique: true },
        image: { type: String, required: true },
        isDeleted: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

const deleteAllCreatorCache = async () => {
    const keys = await redis.keys('categories:*');
    if (keys.length > 0) {
        await redis.del(...keys);
    }
};

SubCategorySchema.post('save', deleteAllCreatorCache);
SubCategorySchema.post('findOneAndUpdate', deleteAllCreatorCache);
SubCategorySchema.post('findOneAndDelete', deleteAllCreatorCache);
SubCategorySchema.post('deleteOne', deleteAllCreatorCache);
SubCategorySchema.post('deleteMany', deleteAllCreatorCache);

const SubCategory = model<ISubCategory>('SubCategory', SubCategorySchema);

export default SubCategory;
