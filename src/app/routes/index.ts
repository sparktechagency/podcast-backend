import { Router } from 'express';
import { albumRoutes } from '../modules/album/album.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { bannerRoutes } from '../modules/banner/banner.routes';
import { bookmarkRoutes } from '../modules/bookmark/bookmark.routes';
import { categoryRoutes } from '../modules/category/category.routes';
import { commentRoutes } from '../modules/comment/comment.routes';
import { creatorRoutes } from '../modules/creator/creator.routes';
import { feedbackRoutes } from '../modules/feedback/feedback.routes';
import { liveSessionRoutes } from '../modules/liveSession/liveSession.routes';
import { liveStreamingRoutes } from '../modules/liveStreaming/liveStreaming.routes';
import { ManageRoutes } from '../modules/manage-web/manage.routes';
import { metaRoutes } from '../modules/meta/meta.routes';
import { normalUserRoutes } from '../modules/normalUser/normalUser.routes';
import { notificationRoutes } from '../modules/notification/notification.routes';
import { podcastPlaylistRoutes } from '../modules/playlist/playlist.routes';
import { podcastRoutes } from '../modules/podcast/podcast.routes';
import { reportRoutes } from '../modules/report/report.routes';
import { subCategoryRoutes } from '../modules/subCategory/subCategory.routes';
import { superAdminRoutes } from '../modules/superAdmin/superAdmin.routes';
import { userRoutes } from '../modules/user/user.routes';
import { watchHistoryRoutes } from '../modules/watchHistory/watchHistory.routes';

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
    {
        path: '/watch-history',
        router: watchHistoryRoutes,
    },
    {
        path: '/bookmark',
        router: bookmarkRoutes,
    },
    {
        path: '/comment',
        router: commentRoutes,
    },
    {
        path: '/live-stream',
        router: liveStreamingRoutes,
    },
    {
        path: '/live-session',
        router: liveSessionRoutes,
    },
    {
        path: '/report',
        router: reportRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.router));

export default router;
