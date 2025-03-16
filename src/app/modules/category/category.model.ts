import { model, Schema } from 'mongoose';
import { ICategory } from './category.interface';
import redis from '../../utilities/redisClient';

const CategorySchema: Schema = new Schema<ICategory>(
    {
        name: { type: String, required: true, unique: true },
        category_image: { type: String, required: true },
        isDeleted: {
            type: Boolean,
            default: false,
        },
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

CategorySchema.post('save', deleteAllCreatorCache);
CategorySchema.post('findOneAndUpdate', deleteAllCreatorCache);
CategorySchema.post('findOneAndDelete', deleteAllCreatorCache);
CategorySchema.post('deleteOne', deleteAllCreatorCache);
CategorySchema.post('deleteMany', deleteAllCreatorCache);

const Category = model<ICategory>('Category', CategorySchema);

export default Category;
