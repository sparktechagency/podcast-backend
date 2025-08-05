import { Types } from 'mongoose';

export interface IBookmark {
    podcast: Types.ObjectId;
    user: string;
}
