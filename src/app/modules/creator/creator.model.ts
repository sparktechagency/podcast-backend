import { Schema, model } from 'mongoose';
import { ICreator } from './creator.interface';
import { ENUM_GENDER } from '../user/user.enum';

const CreatorSchema = new Schema<ICreator>(
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
            default: '',
        },
    },
    { timestamps: true }
);

const Creator = model<ICreator>('Creator', CreatorSchema);
export default Creator;
