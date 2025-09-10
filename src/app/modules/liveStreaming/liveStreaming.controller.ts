import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import liveStreamingServices from './liveStreaming.service';

const createStreamingRoom = catchAsync(async (req, res) => {
    const result = await liveStreamingServices.createStreamingRoom(
        req.user.profileId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Streaming room created successfully',
        data: result,
    });
});

const getJoinToken = catchAsync(async (req, res) => {
    req.body.user_id = req.user.profileId;
    const result = await liveStreamingServices.getJoinToken(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Join token generated successfully',
        data: result,
    });
});

const inviteUser = catchAsync(async (req, res) => {
    const result = await liveStreamingServices.inviteUser(
        req.user.profileId,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'User invited successfully',
        data: result,
    });
});
const endLiveAndStoreRecordings = catchAsync(async (req, res) => {
    const result = await liveStreamingServices.endLiveAndStoreRecordings(
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Room end successfully',
        data: result,
    });
});
const getMyLiveRoom = catchAsync(async (req, res) => {
    const result = await liveStreamingServices.getMyLiveRoom(
        req.user.profileId
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Your live room retrieved successfully',
        data: result,
    });
});
const startRecording = catchAsync(async (req, res) => {
    const result = await liveStreamingServices.startRecording(
        req.user.profileId,
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Recording started successfully',
        data: result,
    });
});

const LiveStreamingController = {
    createStreamingRoom,
    getJoinToken,
    inviteUser,
    endLiveAndStoreRecordings,
    getMyLiveRoom,
    startRecording,
};
export default LiveStreamingController;
