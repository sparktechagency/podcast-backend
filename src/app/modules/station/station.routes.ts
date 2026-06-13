import express from 'express';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import stationController from './station.controller';

const router = express.Router();

router.patch(
    '/update',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req, res, next) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    stationController.updateStation
);

router.get('/get-station', stationController.getStation);

export const stationRoutes = router;
