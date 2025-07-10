import { Types } from 'mongoose';

export interface ISubCategory {
    category: Types.ObjectId;
    name: string;
    category_image: string;
    isDeleted: boolean;
}
