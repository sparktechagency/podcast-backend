import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import podcastValidation from './podcast.validation';
import podcastController from './podcast.controller';

const router = express.Router();

router.post(
    '/create-podcast',
    auth(USER_ROLE.creator),
    validateRequest(podcastValidation.createPodcastValidationSchema),
    podcastController.createPodcast
);

router.patch(
    '/update-podcast/:id',
    auth(USER_ROLE.creator),
    validateRequest(podcastValidation.updatePodcastValidationSchema),
    podcastController.updatePodcast
);

router.get('/all-podcasts', podcastController.getAllPodcasts);
router.get('/get-single-podcast/:id', podcastController.getSinglePodcast);
router.delete(
    '/delete-podcast/:id',
    auth(USER_ROLE.creator),
    podcastController.deletePodcast
);

export const podcastRoutes = router;
