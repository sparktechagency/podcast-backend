import express from 'express';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import liveSessionController from './liveSession.controller';
import liveSessionValidations from './liveSession.validation';

const router = express.Router();

router.patch(
    '/update/:id',
    auth(USER_ROLE.creator),
    uploadFile(),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(liveSessionValidations.updateLiveSessionData),
    liveSessionController.updateLiveSessionData
);

router.get(
    '/get-previous-live',
    auth(USER_ROLE.creator, USER_ROLE.user),
    liveSessionController.getAllLiveSessions
);

export const liveSessionRoutes = router;
