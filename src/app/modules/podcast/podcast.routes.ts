import express, { NextFunction, Request, Response } from 'express';
import { uploadFile } from '../../helper/mutler-s3-uploader';
import auth from '../../middlewares/auth';
import { publicCache } from '../../middlewares/cacheControl';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import podcastController from './podcast.controller';
import podcastValidation from './podcast.validation';

const router = express.Router();
//
router.post(
    '/create',
    auth(USER_ROLE.creator, USER_ROLE.superAdmin),
    validateRequest(podcastValidation.createPodcastValidationSchema),
    podcastController.createPodcast
);
////
router.patch(
    '/update/:id',
    auth(USER_ROLE.creator, USER_ROLE.superAdmin),
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
    '/my-podcasts',
    auth(USER_ROLE.creator, USER_ROLE.superAdmin),
    podcastController.getMyPodcasts
);
router.get(
    '/get-podcast-feed',
    auth(USER_ROLE.user, USER_ROLE.creator),
    podcastController.getPodcastFeedForUser
);
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
router.post(
    '/view/:id',
    auth(USER_ROLE.user, USER_ROLE.creator),
    podcastController.viewPodcast
);
router.get(
    '/subcategory-with-podcasts/:id',
    podcastController.getPodcastForSubcategories
);
router.post(
    '/like-unlike/:id',
    auth(USER_ROLE.user, USER_ROLE.creator),
    podcastController.toggleLikePodcast
);

router.get('/get-home-data', podcastController.getHomeData);
export const podcastRoutes = router;
