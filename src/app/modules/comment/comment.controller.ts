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
const updateComment = catchAsync(async (req, res) => {
    const result = await commentServices.updateComment(
        req.user,
        req.params.id,
        req.body
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Comment updated successfully',
        data: result,
    });
});
const deleteComment = catchAsync(async (req, res) => {
    const result = await commentServices.deleteComment(
        req.user.profileId,
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: 'Comment deleted successfully',
        data: result,
    });
});

const CommentController = {
    createComment,
    createReply,
    updateComment,
    deleteComment,
};
export default CommentController;
