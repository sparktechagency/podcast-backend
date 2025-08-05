import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import commentValidations from './comment.validation';
import commentController from './comment.controller';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.user),
    validateRequest(commentValidations.createCommentSchema),
    commentController.createComment
);

export const commentRoutes = router;
