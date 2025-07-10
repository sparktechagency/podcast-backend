import { Types } from 'mongoose';

export interface IPodcastPlaylist {
    user: Types.ObjectId;
    name: string;
    description: string;
    tags: string[];
    cover_image: string;
    podcasts: Types.ObjectId[];
}
