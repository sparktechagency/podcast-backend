/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';
import { USER_ROLE } from '../user/user.constant';

export interface INormalUser {
    user: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    profile_image: string;
    profile_cover: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    role: (typeof USER_ROLE)[keyof typeof USER_ROLE];
    address: string;
}
