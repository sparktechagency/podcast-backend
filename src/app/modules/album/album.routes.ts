import express, { Request, Response, NextFunction } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import AlbumValidations from './album.validation';
import AlbumController from './album.controller';
import { USER_ROLE } from '../user/user.constant';

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
    validateRequest(AlbumValidations.createAlbumValidationSchema),
    AlbumController.createAlbum
);

router.get(
    '/all-albums',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin, USER_ROLE.user),
    AlbumController.getAllAlbums
);

router.get(
    '/get-single/:albumId',
    auth(
        USER_ROLE.superAdmin,
        USER_ROLE.admin,
        USER_ROLE.user,
        USER_ROLE.creator
    ),
    AlbumController.getAlbumById
);

router.patch(
    '/update/:albumId',
    auth(USER_ROLE.superAdmin),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(AlbumValidations.updateAlbumValidationSchema),
    AlbumController.updateAlbum
);

router.delete(
    '/delete/:albumId',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin, USER_ROLE.user),
    AlbumController.deleteAlbum
);

export const albumRoutes = router;
