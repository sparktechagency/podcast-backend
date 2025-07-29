import { Types } from 'mongoose';

export interface IWatchHistory {
    user: Types.ObjectId;
    podcast: Types.ObjectId;
}
