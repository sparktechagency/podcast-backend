import { Schema, model } from 'mongoose';
import redis from '../../utilities/redisClient';
import { ENUM_GENDER } from '../user/user.enum';
import { ICreator } from './creator.interface';

const creatorSchema = new Schema<ICreator>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        phone: { type: String },
        email: { type: String, required: true },
        address: { type: String },
        profile_image: { type: String, default: '' },
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number], required: true },
        },
        dateOfBirth: {
            type: Date,
        },
        profile_cover: {
            type: String,
            default: '',
        },

        gender: {
            type: String,
            enum: Object.values(ENUM_GENDER),
        },
        isApproved: {
            type: Boolean,
            default: false,
        },
        donationLink: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);
const deleteAllCreatorCache = async () => {
    const keys = await redis.keys('all-creators:*');
    if (keys.length > 0) {
        await redis.del(...keys);
    }
};

creatorSchema.post('save', deleteAllCreatorCache);
creatorSchema.post('findOneAndUpdate', deleteAllCreatorCache);
creatorSchema.post('findOneAndDelete', deleteAllCreatorCache);
creatorSchema.post('deleteOne', deleteAllCreatorCache);
creatorSchema.post('deleteMany', deleteAllCreatorCache);
creatorSchema.index(
    {
        name: 'text',
        email: 'text',
        address: 'text',
    },
    {
        weights: {
            name: 5,
            email: 3,
            address: 1,
        },
    }
);
const Creator = model<ICreator>('Creator', creatorSchema);
export default Creator;
