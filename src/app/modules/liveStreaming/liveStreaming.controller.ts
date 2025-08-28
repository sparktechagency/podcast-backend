import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import liveStreamingServices from './liveStreaming.service';

const createStreamingRoom = catchAsync(async (req, res) => {
    const result = await liveStreamingServices.createStreamingRoom(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Streaming room created successfully',
        data: result,
    });
});

const getJoinToken = catchAsync(async (req, res) => {
    const result = await liveStreamingServices.getJoinToken(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Join token generated successfully',
        data: result,
    });
});

const LiveStreamingController = { createStreamingRoom, getJoinToken };
export default LiveStreamingController;
