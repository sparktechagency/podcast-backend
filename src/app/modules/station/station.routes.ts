import express from 'express';
import { uploadFile } from '../../helper/fileUploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import stationController from './station.controller';
import stationValidations from './station.validation';

const router = express.Router();

router.patch(
    '/update',
    auth(USER_ROLE.user),
    uploadFile(),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(stationValidations.updateStationData),
    stationController.updateUserProfile
);

export const stationRoutes = router;
