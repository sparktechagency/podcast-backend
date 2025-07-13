import express, { Request, Response, NextFunction } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import PodcastPlaylistValidations from './playlist.validation';
import PodcastPlaylistController from './playlist.controller';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.user),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(
        PodcastPlaylistValidations.createPodcastPlaylistValidationSchema
    ),
    PodcastPlaylistController.createPlaylist
);

router.get(
    '/all',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin, USER_ROLE.user),
    PodcastPlaylistController.getAllPlaylists
);

router.get(
    '/my-playlists',
    auth(USER_ROLE.user),
    PodcastPlaylistController.getMyPlaylists
);

router.get(
    '/get-single/:playlistId',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin, USER_ROLE.user),
    PodcastPlaylistController.getPlaylistById
);

router.patch(
    '/update/:playlistId',
    auth(USER_ROLE.user),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(
        PodcastPlaylistValidations.updatePodcastPlaylistValidationSchema
    ),
    PodcastPlaylistController.updatePlaylist
);

router.delete(
    '/delete/:playlistId',
    auth(USER_ROLE.superAdmin, USER_ROLE.admin, USER_ROLE.user),
    PodcastPlaylistController.deletePlaylist
);

export const podcastPlaylistRoutes = router;
