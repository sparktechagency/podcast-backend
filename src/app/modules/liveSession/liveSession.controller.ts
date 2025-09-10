/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { getCloudFrontUrl } from '../../helper/mutler-s3-uploader';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import LiveSessionServices from './liveSession.service';

const updateLiveSessionData = catchAsync(async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const profileId = req.user.profileId;
    const file: any = req.files?.liveCover;
    if (file) {
        req.body.coverImage = getCloudFrontUrl(file[0].key);
    }

    const result = await LiveSessionServices.updateLiveSessionData(
        profileId,
        id,
        payload
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Live session updated successfully',
        data: result,
    });
});

const getAllLiveSessions = catchAsync(async (req, res) => {
    const result = await LiveSessionServices.getAllLiveSessions(req.query);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Live session retrieved successfully',
        data: result,
    });
});
const getMyLivesessions = catchAsync(async (req, res) => {
    const result = await LiveSessionServices.getMyLivesessions(
        req.user.profileId,
        req.query
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Live session retrieved successfully',
        data: result,
    });
});
const togglePublicPrivate = catchAsync(async (req, res) => {
    const result = await LiveSessionServices.togglePublicPrivate(
        req.user.profileId,
        req.params.id
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: result?.isPublic
            ? 'Live recording publiced successfully'
            : 'Live recording privated successfully',
        data: result,
    });
});
const deleteLive = catchAsync(async (req, res) => {
    const result = await LiveSessionServices.deleteLive(
        req.user.profileId,
        req.params.id
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Live deleted successfully',
        data: result,
    });
});

const LiveSessionController = {
    updateLiveSessionData,
    getAllLiveSessions,
    togglePublicPrivate,
    deleteLive,
    getMyLivesessions,
};

export default LiveSessionController;
