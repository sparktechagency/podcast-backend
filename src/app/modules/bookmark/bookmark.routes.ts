import express from 'express';
import { USER_ROLE } from '../user/user.constant';
import auth from '../../middlewares/auth';
import BookmarkController from './bookmark.controller';

const router = express.Router();

router.post(
    '/add-delete-bookmark/:id',
    auth(USER_ROLE.user, USER_ROLE.creator),
    BookmarkController.productBookmarkAddDelete
);
router.get(
    '/my-bookmarks',
    auth(USER_ROLE.user, USER_ROLE.creator),
    BookmarkController.getMyBookmark
);

export const bookmarkRoutes = router;
