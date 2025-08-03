/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { INormalUser } from './normalUser.interface';
import NormalUser from './normalUser.model';
import QueryBuilder from '../../builder/QueryBuilder';

const updateUserProfile = async (id: string, payload: Partial<INormalUser>) => {
    console.log('paylaod', payload);
    const user = await NormalUser.findById(id);
    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, 'Profile not found');
    }
    const result = await NormalUser.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    return result;
};

// get single user
const getSingleUser = async (id: string) => {
    const result = await NormalUser.findById(id);
    if (!result) {
        throw new AppError(httpStatus.NOT_FOUND, 'User not found');
    }

    return result;
};

const getAllUsers = async (query: Record<string, unknown>) => {
    const resultQuery = new QueryBuilder(
        NormalUser.find().populate('user', 'isBlocked'),
        query
    )
        .search(['name'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();
    return {
        meta,
        result,
    };
};

const NormalUserServices = {
    updateUserProfile,
    getSingleUser,
    getAllUsers,
};

export default NormalUserServices;
