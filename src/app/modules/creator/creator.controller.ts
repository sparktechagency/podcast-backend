/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import CreatorService from './creator.service';

const updateCreatorProfile = catchAsync(async (req, res) => {
    const file: any = req.files?.profile_image;
    if (file) {
        req.body.profile_image = getCloudFrontUrl(file[0].key);
    }

    const result = await CreatorService.updateCreatorProfile(
        req?.user?.profileId,
        req.body
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Creator profile updated successfully',
        data: result,
    });
});

const getAllCreators = catchAsync(async (req, res) => {
    const result = await CreatorService.getAllCreators(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Creators retrieved successfully',
        data: result,
    });
});

const getSingleCreator = catchAsync(async (req, res) => {
    const result = await CreatorService.getSingleCreator(req.params.id);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Creator retrieved successfully',
        data: result,
    });
});
const getTopCreators = catchAsync(async (req, res) => {
    const result = await CreatorService.getTopCreators(req.query);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Top creators retrieved successfully',
        data: result,
    });
});

const CreatorController = {
    updateCreatorProfile,
    getAllCreators,
    getSingleCreator,
    getTopCreators,
};

export default CreatorController;
