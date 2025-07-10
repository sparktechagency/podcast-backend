import { Types } from 'mongoose';

export interface IAdmin {
    _id: string;
    user: Types.ObjectId;
    name: string;
    email: string;
    profile_image: string;
    isDeleted: boolean;
    phone: string;
}
