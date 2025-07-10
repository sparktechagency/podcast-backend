import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { ICreator } from './creator.interface';
import Creator from './creator.model';
import QueryBuilder from '../../builder/QueryBuilder';

const updateCreatorProfile = async (id: string, payload: Partial<ICreator>) => {
    const creator = await Creator.findById(id);
    if (!creator) {
        throw new AppError(httpStatus.NOT_FOUND, 'Creator profile not found');
    }

    const result = await Creator.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    return result;
};

const getSingleCreator = async (id: string) => {
    const creator = await Creator.findById(id);
    if (!creator) {
        throw new AppError(httpStatus.NOT_FOUND, 'Creator not found');
    }

    return creator;
};

const getAllCreators = async (query: Record<string, unknown>) => {
    const resultQuery = new QueryBuilder(Creator.find(), query)
        .search(['name', 'email'])
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

const CreatorService = {
    updateCreatorProfile,
    getSingleCreator,
    getAllCreators,
};

export default CreatorService;
