import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { ISubCategory } from './subCategory.interface';
import SubCategory from './subCategory.model';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import QueryBuilder from '../../builder/QueryBuilder';

const createSubCategoryIntoDB = async (payload: ISubCategory) => {
    const result = await SubCategory.create(payload);
    return result;
};

const updateSubCategoryIntoDB = async (
    id: string,
    payload: Partial<ISubCategory>
) => {
    const subCategory = await SubCategory.findOne({ _id: id });
    if (!subCategory) {
        throw new AppError(httpStatus.NOT_FOUND, 'Subcategory not found');
    }

    const result = await SubCategory.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    if (payload.image && subCategory.image) {
        deleteFileFromS3(subCategory.image);
    }

    return result;
};

const getAllSubCategories = async (query: Record<string, unknown>) => {
    const resultQuery = new QueryBuilder(
        SubCategory.find({ isDeleted: false }).populate({
            path: 'category',
            select: 'name',
        }),
        query
    )
        .search(['name'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();

    return { meta, result };
};

const getSingleSubCategory = async (id: string) => {
    const subCategory = await SubCategory.findById(id).populate({
        path: 'category',
        select: 'name',
    });
    if (!subCategory) {
        throw new AppError(httpStatus.NOT_FOUND, 'Subcategory not found');
    }

    return subCategory;
};

const deleteSubCategoryFromDB = async (id: string) => {
    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
        throw new AppError(httpStatus.NOT_FOUND, 'Subcategory not found');
    }

    const result = await SubCategory.findByIdAndUpdate(id, { isDeleted: true });
    return result;
};

const subCategoryService = {
    createSubCategoryIntoDB,
    updateSubCategoryIntoDB,
    getAllSubCategories,
    getSingleSubCategory,
    deleteSubCategoryFromDB,
};

export default subCategoryService;
