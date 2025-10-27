import { Types } from 'mongoose';
export interface ISubCategory {
    category: Types.ObjectId;
    name: string;
    image: string;
    isDeleted: boolean;
}
