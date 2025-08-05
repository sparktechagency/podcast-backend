import { Types } from 'mongoose';

export interface IComment {
    _id?: Types.ObjectId;
    podcast: Types.ObjectId;
    text: string;
    likers: Types.ObjectId[];
    parent: Types.ObjectId;
    commentor: Types.ObjectId;
    commentorType: 'NormalUser' | 'Creator';
    likerType: 'NormalUser' | 'Creator';
}
