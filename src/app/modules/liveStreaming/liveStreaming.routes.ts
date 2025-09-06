import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import liveStreamingController from './liveStreaming.controller';
import liveStreamingValidations from './liveStreaming.validation';

const router = express.Router();

router.post(
    '/create-streaming-room',
    auth(USER_ROLE.creator),
    liveStreamingController.createStreamingRoom
);
router.post(
    '/get-join-token',
    auth(USER_ROLE.creator, USER_ROLE.user),
    liveStreamingController.getJoinToken
);
router.get(
    '/get-my-live-room',
    auth(USER_ROLE.creator),
    liveStreamingController.getMyLiveRoom
);
router.post(
    '/invite-user',
    auth(USER_ROLE.creator),
    validateRequest(liveStreamingValidations.inviteUserValidationSchema),
    liveStreamingController.inviteUser
);
router.post(
    '/end-live/:id',
    // auth(USER_ROLE.creator),
    liveStreamingController.endLiveAndStoreRecordings
);

export const liveStreamingRoutes = router;
