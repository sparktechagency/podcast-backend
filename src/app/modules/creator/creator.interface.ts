import { Types } from 'mongoose';
import { ENUM_GENDER } from '../user/user.enum';
// interface
export interface ICreator {
    user: Types.ObjectId;
    name: string;
    phone?: string;
    email: string;
    address?: string;
    profile_image?: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    dateOfBirth: Date;
    profile_cover: string;
    gender: (typeof ENUM_GENDER)[keyof typeof ENUM_GENDER];
    isApproved: boolean;
    donationLink?: string;
}
