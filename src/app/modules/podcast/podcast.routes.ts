import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import podcastValidation from './podcast.validation';
import podcastController from './podcast.controller';
import express, { NextFunction, Request, Response } from 'express';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import { publicCache } from '../../middlewares/cacheControl';

const router = express.Router();

router.post(
    '/create',
    auth(USER_ROLE.creator),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(podcastValidation.createPodcastValidationSchema),
    podcastController.createPodcast
);

router.patch(
    '/update/:id',
    auth(USER_ROLE.creator),
    uploadFile(),
    (req: Request, res: Response, next: NextFunction) => {
        if (req.body.data) {
            req.body = JSON.parse(req.body.data);
        }
        next();
    },
    validateRequest(podcastValidation.updatePodcastValidationSchema),
    podcastController.updatePodcast
);

router.get('/all', podcastController.getAllPodcasts);
router.get(
    '/get-single/:id',
    publicCache(),
    podcastController.getSinglePodcast
);
router.delete(
    '/delete-podcast/:id',
    auth(USER_ROLE.creator, USER_ROLE.superAdmin),
    podcastController.deletePodcast
);

export const podcastRoutes = router;
