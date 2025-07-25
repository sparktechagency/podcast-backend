import { Router } from 'express';
import { userRoutes } from '../modules/user/user.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { ManageRoutes } from '../modules/manage-web/manage.routes';
import { normalUserRoutes } from '../modules/normalUser/normalUser.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { bannerRoutes } from '../modules/banner/banner.routes';
import { metaRoutes } from '../modules/meta/meta.routes';
import { feedbackRoutes } from '../modules/feedback/feedback.routes';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes';
import { podcastRoutes } from '../modules/podcast/podcast.routes';
import { podcastPlaylistRoutes } from '../modules/playlist/playlist.routes';
import { albumRoutes } from '../modules/album/album.routes';
import { categoryRoutes } from '../modules/category/category.routes';
import { subCategoryRoutes } from '../modules/subCategory/subCategory.routes';
import { creatorRoutes } from '../modules/creator/creator.routes';

const router = Router();

const moduleRoutes = [
    {
        path: '/auth',
        router: authRoutes,
    },
    {
        path: '/user',
        router: userRoutes,
    },
    {
        path: '/normal-user',
        router: normalUserRoutes,
    },

    {
        path: '/manage',
        router: ManageRoutes,
    },
    {
        path: '/notification',
        router: notificationRoutes,
    },

    {
        path: '/banner',
        router: bannerRoutes,
    },
    {
        path: '/meta',
        router: metaRoutes,
    },
    {
        path: '/feedback',
        router: feedbackRoutes,
    },
    {
        path: '/super-admin',
        router: superAdminRoutes,
    },
    {
        path: '/podcast',
        router: podcastRoutes,
    },
    {
        path: '/playlist',
        router: podcastPlaylistRoutes,
    },
    {
        path: '/album',
        router: albumRoutes,
    },
    {
        path: '/category',
        router: categoryRoutes,
    },
    {
        path: '/sub-category',
        router: subCategoryRoutes,
    },
    {
        path: '/creator',
        router: creatorRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.router));

export default router;
