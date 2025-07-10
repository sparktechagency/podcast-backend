import { Types } from 'mongoose';

export interface IPodcast {
    creator: Types.ObjectId;
    category: Types.ObjectId;
    subCategory: Types.ObjectId;
    name: string;
    coverImage: string;
    video_url: string;
    audio_url: string;
    title: string;
    description: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    address: string;
    tags: string[];
}
