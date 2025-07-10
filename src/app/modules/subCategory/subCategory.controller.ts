/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import subCategoryService from './subCategory.service';

const createSubCategory = catchAsync(async (req, res) => {
    const file: any = req.files?.sub_category_image;
    if (file) {
        req.body.image = getCloudFrontUrl(file[0].key);
    }

    const result = await subCategoryService.createSubCategoryIntoDB(req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subcategory created successfully',
        data: result,
    });
});

const updateSubCategory = catchAsync(async (req, res) => {
    const file: any = req.files?.sub_category_image;
    if (file) {
        req.body.image = getCloudFrontUrl(file[0].key);
    }

    const result = await subCategoryService.updateSubCategoryIntoDB(
        req.params.id,
        req.body
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subcategory updated successfully',
        data: result,
    });
});

const getAllSubCategories = catchAsync(async (req, res) => {
    const result = await subCategoryService.getAllSubCategories(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subcategories retrieved successfully',
        data: result,
    });
});

const getSingleSubCategory = catchAsync(async (req, res) => {
    const result = await subCategoryService.getSingleSubCategory(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subcategory retrieved successfully',
        data: result,
    });
});

const deleteSubCategory = catchAsync(async (req, res) => {
    const result = await subCategoryService.deleteSubCategoryFromDB(
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Subcategory deleted successfully',
        data: result,
    });
});

const subCategoryController = {
    createSubCategory,
    updateSubCategory,
    getAllSubCategories,
    getSingleSubCategory,
    deleteSubCategory,
};

export default subCategoryController;
