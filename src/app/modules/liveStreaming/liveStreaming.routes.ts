import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import liveStreamingController from './liveStreaming.controller';
import liveStreamingValidations from './liveStreaming.validation';

const router = express.Router();

router.post(
    '/create-streaming-room',
    auth(USER_ROLE.user),
    validateRequest(
        liveStreamingValidations.createStreamingRoomValidationSchema
    ),
    liveStreamingController.createStreamingRoom
);
router.get(
    '/get-join-token',
    auth(USER_ROLE.user),
    liveStreamingController.getJoinToken
);
router.get(
    '/invite-user',
    auth(USER_ROLE.user),
    validateRequest(liveStreamingValidations.inviteUserValidationSchema),
    liveStreamingController.inviteUser
);

export const liveStreamingRoutes = router;
