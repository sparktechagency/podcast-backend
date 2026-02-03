import express, { NextFunction, Request, Response } from 'express';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import AlbumController from './album.controller';
import AlbumValidations from './album.validation';

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
    auth(
        USER_ROLE.superAdmin,
        USER_ROLE.admin,
        USER_ROLE.user,
        USER_ROLE.creator
    ),
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
router.post(
    '/add-podcast/:albumId',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin),
    AlbumController.addPodcastToAlbum
);

/* Remove a podcast from an album */
router.delete(
    '/remove-podcast/:albumId/:podcastId',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin),
    AlbumController.removePodcastFromAlbum
);
export const albumRoutes = router;
