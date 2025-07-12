import { Types } from 'mongoose';

export interface IAlbum {
    name: string;
    description: string;
    tags: string[];
    cover_image: string;
    podcasts: Types.ObjectId[];
}
