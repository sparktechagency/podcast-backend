import express, { NextFunction, Request, Response } from 'express';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import bannerController from './banner.controller';
import bannerValidations from './banner.validation';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(bannerValidations.createBannerValidationSchema),
    bannerController.createBanner
);

router.get(
    '/get-all',
    auth(
        USER_ROLE.admin,
        USER_ROLE.superAdmin,
        USER_ROLE.user,
        USER_ROLE.creator
    ),
    bannerController.getAllBanners
);

router.patch(
    '/update/:id',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(bannerValidations.updateBannerValidationSchema),
    bannerController.updateBanner
);

router.delete(
    '/delete/:id',
    auth(USER_ROLE.superAdmin),
    bannerController.deleteBanner
);

export const bannerRoutes = router;
