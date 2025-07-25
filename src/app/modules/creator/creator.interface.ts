import { Types } from 'mongoose';

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
}
