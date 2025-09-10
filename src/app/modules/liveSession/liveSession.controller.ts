import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import LiveSessionServices from './liveSession.service';

const updateLiveSessionData = catchAsync(async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const profileId = req.user.profileId;

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

const LiveSessionController = {
    updateLiveSessionData,
    getAllLiveSessions,
};

export default LiveSessionController;
