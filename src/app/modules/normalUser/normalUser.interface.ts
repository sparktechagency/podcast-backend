/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from 'mongoose';

export interface INormalUser {
    user: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    profile_image: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
}
