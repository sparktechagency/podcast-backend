import express, { Request, Response, NextFunction } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import creatorValidation from './creator.validation';
import CreatorController from './creator.controller';
import { uploadFile } from '../../helper/mutler-s3-uploader';

const router = express.Router();

router.patch(
    '/update-profile',
    auth(USER_ROLE.creator),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(creatorValidation.updateCreatorValidationSchema),
    CreatorController.updateCreatorProfile
);

router.get(
    '/get-all-creators',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin),
    CreatorController.getAllCreators
);

router.get(
    '/single-creator/:id',
    auth(USER_ROLE.superAdmin, USER_ROLE.creator),
    CreatorController.getSingleCreator
);

export const creatorRoutes = router;
