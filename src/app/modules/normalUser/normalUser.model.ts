import { model, Schema } from 'mongoose';
import { INormalUser } from './normalUser.interface';

const NormalUserSchema = new Schema<INormalUser>(
    {
        user: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            default: '',
        },
        phone: {
            type: String,
        },
        profile_image: {
            type: String,
            default: '',
        },
        profile_cover: {
            type: String,
            default: '',
        },

        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // ✅ removed required: true to make it optional
            },
        },
        address: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const NormalUser = model<INormalUser>('NormalUser', NormalUserSchema);

export default NormalUser;
