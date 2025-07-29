import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import watchHistoryServices from './watchHistory.service';

const getWatchedHistory = catchAsync(async (req, res) => {
    const result = await watchHistoryServices.getWatchedHistory(
        req.user.profileId,
        req.query
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Watched history retrieved successfully',
        data: result,
    });
});

const WatchHistoryController = { getWatchedHistory };
export default WatchHistoryController;
