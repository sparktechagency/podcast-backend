import { Types } from 'mongoose';

export interface IPodcast {
    creator: Types.ObjectId;
    category: Types.ObjectId;
    subCategory: Types.ObjectId;
    name: string;
    coverImage: string;
    podcast_url?: string;
    title: string;
    description: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
    };
    address: string;
    tags: string[];
    totalView: number;
    duration: number;
    likers: Types.ObjectId[];
    station?: Types.ObjectId | null;
}
