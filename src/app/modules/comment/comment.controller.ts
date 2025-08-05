import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import commentServices from './comment.service';

const createComment = catchAsync(async (req, res) => {
    const result = await commentServices.createComment(req.user, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Comment created successfully',
        data: result,
    });
});

const createReply = catchAsync(async (req, res) => {
    const result = await commentServices.createComment(req.user, req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Reply created successfully',
        data: result,
    });
});

const CommentController = { createComment, createReply };
export default CommentController;
