import { model, Schema } from 'mongoose';
import { INormalUser } from './normalUser.interface';
import { ENUM_GENDER } from '../user/user.enum';

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
            default: '',
        },
        dateOfBirth: {
            type: Date,
            default: null,
        },
        gender: {
            type: String,
            enum: Object.values(ENUM_GENDER),
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const NormalUser = model<INormalUser>('NormalUser', NormalUserSchema);

export default NormalUser;
