import httpStatus from 'http-status';
import catchAsync from '../../utilities/catchasync';
import sendResponse from '../../utilities/sendResponse';
import BookmarkService from './bookmark.service';

const productBookmarkAddDelete = catchAsync(async (req, res) => {
    const result = await BookmarkService.bookmarkAddDelete(
        req.user.profileId,
        req.params.id
    );
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: result
            ? 'Bookmark added successfully'
            : 'Bookmark deleted successfully',
        data: result,
    });
});
// get my bookmark---------
const getMyBookmark = catchAsync(async (req, res) => {
    const result = await BookmarkService.getMyBookmarkFromDB(
        req?.user?.profileId,
        req.query
    );

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: 'Bookmark retrieved successfully',
        data: result,
    });
});

const BookmarkController = {
    productBookmarkAddDelete,
    getMyBookmark,
};

export default BookmarkController;
