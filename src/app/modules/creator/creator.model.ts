import { Schema, model } from 'mongoose';
import { ICreator } from './creator.interface';

const CreatorSchema = new Schema<ICreator>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        phone: { type: String },
        email: { type: String, required: true },
        address: { type: String },
        profile_image: { type: String, default: '' },
    },
    { timestamps: true }
);

const Creator = model<ICreator>('Creator', CreatorSchema);
export default Creator;
