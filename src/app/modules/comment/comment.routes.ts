import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import commentValidations from './comment.validation';
import commentController from './comment.controller';

const router = express.Router();

router.post(
    '/create-comment',
    auth(USER_ROLE.user, USER_ROLE.creator),
    validateRequest(commentValidations.createCommentSchema),
    commentController.createComment
);
router.post(
    '/create-reply',
    auth(USER_ROLE.user, USER_ROLE.creator),
    validateRequest(commentValidations.createReplySchema),
    commentController.createReply
);
router.patch(
    '/update-comment/:id',
    auth(USER_ROLE.user, USER_ROLE.creator),
    validateRequest(commentValidations.updateCommentValidationSchema),
    commentController.updateComment
);
router.delete(
    '/delete-comment/:id',
    auth(USER_ROLE.user, USER_ROLE.creator),
    commentController.deleteComment
);

export const commentRoutes = router;
