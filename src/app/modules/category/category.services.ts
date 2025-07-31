/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { ICategory } from './category.interface';
import Category from './category.model';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';

// create category into db
const createCategoryIntoDB = async (payload: ICategory) => {
    const result = await Category.create(payload);
    return result;
};
const updateCategoryIntoDB = async (
    id: string,
    payload: Partial<ICategory>
) => {
    const category = await Category.findOne({ _id: id });
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }
    const result = await Category.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    if (payload.category_image) {
        if (category.category_image) {
            deleteFileFromS3(category.category_image);
        }
    }
    return result;
};

// const getAllCategories = async (query: Record<string, unknown>) => {
//     const resultQuery = new QueryBuilder(
//         Category.find({ isDeleted: false }),
//         query
//     )
//         .search(['name'])
//         .fields()
//         .filter()
//         .paginate()
//         .sort();

//     const result = await resultQuery.modelQuery;
//     const meta = await resultQuery.countTotal();
//     return {
//         meta,
//         result,
//     };
// };
const getAllCategories = async(query:Record<string,unknown>)=>{
     const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const matchConditions : any = {
        isDeleted:false
    }

const data = await Category.aggregate([
        {
            $match: matchConditions,
        },
        {
            $lookup: {
                from: 'subcategories',
                localField: '_id',
                foreignField: 'category',
                as: 'subcategories',
            },
        },
        {
            $addFields: {
                totalSubcategory: {
                    $size: {
                        $filter: {
                            input: '$subcategories',
                            as: 'sub',
                            cond: { $eq: ['$$sub.isDeleted', false] },
                        },
                    },
                },
                subcategories: {
                    $filter: {
                        input: '$subcategories',
                        as: 'sub',
                        cond: { $eq: ['$$sub.isDeleted', false] },
                    },
                },
            },
        },
        {
            $sort: { createdAt: -1 },
        },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ]);

    const result = data[0]?.result || [];
    const total = data[0]?.totalCount[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    return {
        meta: {
            page,
            limit,
            total,
            totalPage,
        },
        result,
    };

}

const getSingleCategory = async (id: string) => {
    const category = await Category.findById(id);
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }

    return category;
};
// delete category
const deleteCategoryFromDB = async (categoryId: string) => {
    const category = await Category.findById(categoryId);
    if (!category) {
        throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }
    const result = await Category.findByIdAndUpdate(categoryId, {
        isDeleted: true,
    });
    return result;
};

const categoryService = {
    createCategoryIntoDB,
    updateCategoryIntoDB,
    getAllCategories,
    getSingleCategory,
    deleteCategoryFromDB,
};

export default categoryService;
