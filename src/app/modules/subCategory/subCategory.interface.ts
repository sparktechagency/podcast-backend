import { Types } from 'mongoose';
// cateogry interface
export interface ISubCategory {
    category: Types.ObjectId;
    name: string;
    image: string;
    isDeleted: boolean;
}
