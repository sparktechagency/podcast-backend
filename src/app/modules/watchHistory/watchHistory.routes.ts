import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import watchHistoryController from './watchHistory.controller';

const router = express.Router();

router.get(
    '/get-all',
    auth(USER_ROLE.user, USER_ROLE.creator),

    watchHistoryController.getWatchedHistory
);

export const watchHistoryRoutes = router;
