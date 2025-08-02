import { Types } from 'mongoose';

export interface IWatchHistory {
    user: string;
    podcast: Types.ObjectId;
}
