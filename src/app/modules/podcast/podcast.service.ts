/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { IPodcast } from './podcast.interface';
import Podcast from './podcast.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import Category from '../category/category.model';
import SubCategory from '../subCategory/subCategory.model';
import redis from '../../utilities/redisClient';
import { createCacheKey } from '../../helper/createCacheKey';
import { CACHE_TTL_SECONDS } from '../../constant';
import WatchHistory from '../watchHistory/watchHistory.model';
import Album from '../album/album.model';
import { getCloudFrontUrl } from '../../helper/getCloudFontUrl';
import crypto from 'crypto';
const createPodcastIntoDB = async (userId: string, payload: IPodcast) => {
    const [category, subCategory] = await Promise.all([
        Category.findById(payload.category),
        SubCategory.findById(payload.subCategory),
    ]);

    if (!category || !subCategory) {
        throw new AppError(
            httpStatus.NOT_FOUND,
            !category ? 'Category not found' : 'Sub category not found'
        );
    }

    if (payload.audio_url) {
        payload.audio_url = getCloudFrontUrl(payload.audio_url);
    }
    if (payload.video_url) {
        payload.audio_url = getCloudFrontUrl(payload.video_url);
    }
    if (payload.coverImage) {
        payload.coverImage = getCloudFrontUrl(payload.coverImage);
    }

    return await Podcast.create({ ...payload, creator: userId });
};

const updatePodcastIntoDB = async (
    userId: string,
    id: string,
    payload: Partial<IPodcast>
) => {
    const podcast = await Podcast.findOne({ _id: id, creator: userId });
    if (!podcast) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
    }

    const reuslt = await Podcast.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    if (payload.audio_url) {
        payload.audio_url = getCloudFrontUrl(payload.audio_url);
        deleteFileFromS3(podcast?.audio_url);
    }
    if (payload.video_url) {
        payload.audio_url = getCloudFrontUrl(payload.video_url);
        deleteFileFromS3(podcast?.video_url);
    }

    if (payload.coverImage && podcast?.coverImage) {
        deleteFileFromS3(podcast?.coverImage);
    }

    return reuslt;
};

const getAllPodcasts = async (query: Record<string, unknown>) => {
    const cacheKey = createCacheKey(query);

    // 1. Try to get cached data from Redis
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        // Cache hit - parse and return
        return JSON.parse(cachedData);
    }

    const resultQuery = new QueryBuilder(Podcast.find(), query)
        .search(['name', 'title', 'description'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();
    const dataToCache = { meta, result };

    // 3. Store result in Redis cache with TTL
    await redis.set(
        cacheKey,
        JSON.stringify(dataToCache),
        'EX',
        CACHE_TTL_SECONDS
    );

    return dataToCache;
};

// const getPodcastFeedForUser = async (
//     userId: string,
//     query: Record<string, unknown>
// ) => {
//     if (!query.category || !query.subCategory) {
//         const lastWatched: any = await WatchHistory.findOne({
//             user: userId,
//         })
//             .populate({ path: 'podcast', select: 'category subcategory' })
//             .sort({ watchedAt: -1 });

//         query.category =
//             query.category || lastWatched?.podcast.category?.toString();
//         query.subCategory =
//             query.subCategory || lastWatched?.podcast?.subCategory?.toString();
//     }

//     const watchedPodcastIds = await WatchHistory.find({
//         user: userId,
//     }).distinct('podcast');

//     // 2. Generate unique cache key
//     const cacheKey = `feed:user:${userId}:${watchedPodcastIds}:${createCacheKey(
//         query
//     )}`;

//     // 3. Try to fetch from Redis
//     const cachedData = await redis.get(cacheKey);
//     if (cachedData) {
//         return JSON.parse(cachedData);
//     }

//     const resultQuery = new QueryBuilder(
//         Podcast.find({ _id: { $nin: watchedPodcastIds } }),
//         query
//     )
//         .search(['name', 'title', 'description'])
//         .fields()
//         .filter()
//         .paginate()
//         .sort();

//     const result = await resultQuery.modelQuery;
//     const meta = await resultQuery.countTotal();
//     const dataToCache = {
//         meta,
//         result,
//     };
//     await redis.set(
//         cacheKey,
//         JSON.stringify(dataToCache),
//         'EX',
//         CACHE_TTL_SECONDS // e.g. 300 seconds = 5 min
//     );
//     return {
//         meta,
//         result,
//     };
// };

export const getPodcastFeedForUser = async (
    userId: string,
    query: Record<string, unknown>
) => {
    // 1. Infer category/subCategory from last watched
    if (!query.category || !query.subCategory) {
        const lastWatched: any = await WatchHistory.findOne({ user: userId })
            .populate({ path: 'podcast', select: 'category subCategory' })
            .sort({ watchedAt: -1 });

        query.category ||= lastWatched?.podcast?.category?.toString();
        query.subCategory ||= lastWatched?.podcast?.subCategory?.toString();
    }

    // 2. Get all watched podcast IDs
    const watchedPodcastIds: any = await WatchHistory.find({
        user: userId,
    }).distinct('podcast');

    // 3. Shorten watched list using hash for caching
    const hashWatchedIds = crypto
        .createHash('md5')
        .update(JSON.stringify(watchedPodcastIds))
        .digest('hex');

    // 4. Strict priority match strategies
    const strategies: MatchStrategy[] = [
        'unwatched_both',
        'unwatched_either',
        'watched_both',
        'watched_either',
        'any',
    ];

    for (const strategy of strategies) {
        const feed = await tryFetchFromDBOrCache(
            userId,
            query,
            watchedPodcastIds,
            hashWatchedIds,
            strategy
        );
        if (feed) return feed;
    }

    // Final fallback
    return {
        meta: { total: 0, page: 1, limit: 10 },
        result: [],
    };
};

type MatchStrategy =
    | 'unwatched_both'
    | 'unwatched_either'
    | 'watched_both'
    | 'watched_either'
    | 'any';

const tryFetchFromDBOrCache = async (
    userId: string,
    query: Record<string, unknown>,
    watchedIds: string[],
    hashWatchedIds: string,
    strategy: MatchStrategy
) => {
    const cacheKey = `feed:${userId}:${strategy}:${hashWatchedIds}:${createCacheKey(
        query
    )}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let mongoQuery: Record<string, any> = {};

    const matchBoth =
        query.category && query.subCategory
            ? { category: query.category, subCategory: query.subCategory }
            : {};

    const matchEither = {
        $or: [
            ...(query.category ? [{ category: query.category }] : []),
            ...(query.subCategory ? [{ subCategory: query.subCategory }] : []),
        ],
    };

    switch (strategy) {
        case 'unwatched_both':
            mongoQuery = { _id: { $nin: watchedIds }, ...matchBoth };
            break;
        case 'unwatched_either':
            mongoQuery = { _id: { $nin: watchedIds }, ...matchEither };
            break;
        case 'watched_both':
            mongoQuery = { _id: { $in: watchedIds }, ...matchBoth };
            break;
        case 'watched_either':
            mongoQuery = { _id: { $in: watchedIds }, ...matchEither };
            break;
        case 'any':
            mongoQuery = {}; // match all
            break;
    }

    const resultQuery = new QueryBuilder(Podcast.find(mongoQuery), query)
        .search(['title', 'name', 'description'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();

    if (result.length > 0) {
        const toCache = { meta, result };
        await redis.set(
            cacheKey,
            JSON.stringify(toCache),
            'EX',
            CACHE_TTL_SECONDS
        );
        return toCache;
    }

    return null;
};

// const getPodcastFeedForUser = async (
//     userId: string,
//     query: Record<string, unknown>
// ) => {
//     const { page = 1, limit = 10 } = query;
//     let { category, subCategory } = query;

//     // Fallback to last watched category/subCategory
//     if (!category || !subCategory) {
//         const lastWatched: any = await WatchHistory.findOne({ user: userId })
//             .populate({ path: 'podcast', select: 'category subCategory' })
//             .sort({ watchedAt: -1 });

//         category = category || lastWatched?.podcast?.category?.toString();
//         subCategory =
//             subCategory || lastWatched?.podcast?.subCategory?.toString();
//     }

//     // Cache key only for category/subCategory
//     const baseCacheKey = `feed:category:${category}:sub:${subCategory}`;

//     let basePodcastList: IPodcast[] = [];

//     // Try cache
//     const cachedData = await redis.get(baseCacheKey);
//     if (cachedData) {
//         basePodcastList = JSON.parse(cachedData);
//     } else {
//         // Fetch and cache if not found
//         basePodcastList = await Podcast.find({ category, subCategory })
//             .sort({ createdAt: -1 })
//             .limit(50)
//             .lean();
//         await redis.set(
//             baseCacheKey,
//             JSON.stringify(basePodcastList),
//             'EX',
//             60 * 3
//         );
//     }

//     // Get user's watched podcast IDs
//     const watchedIds = await WatchHistory.find({ user: userId }).distinct(
//         'podcast'
//     );

//     // Filter out watched podcasts
//     const unwatchedList = basePodcastList.filter(
//         (podcast: any) => !watchedIds.includes(podcast._id.toString())
//     );

//     // Paginate
//     const start = (Number(page) - 1) * Number(limit);
//     const end = start + Number(limit);
//     const paginated = unwatchedList.slice(start, end);

//     return {
//         meta: {
//             total: unwatchedList.length,
//             page: Number(page),
//             limit: Number(limit),
//             totalPage: Number(unwatchedList.length / Number(limit)),
//         },
//         result: paginated,
//     };
// };

const getSinglePodcast = async (id: string) => {
    const podcast = await Podcast.findById(id);
    if (!podcast) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
    }

    return podcast;
};

const deletePodcastFromDB = async (userId: string, id: string) => {
    const podcast = await Podcast.findOne({ _id: id, creator: userId });
    if (!podcast) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
    }
    if (podcast.audio_url) {
        podcast.audio_url = getCloudFrontUrl(podcast.audio_url);
        deleteFileFromS3(podcast?.audio_url);
    }
    if (podcast.video_url) {
        podcast.audio_url = getCloudFrontUrl(podcast.video_url);
        deleteFileFromS3(podcast?.video_url);
    }
    return await Podcast.findByIdAndDelete(id);
};

const countPodcastView = async (profileId: string, podcastId: string) => {
    await Podcast.findByIdAndUpdate(podcastId, { $inc: { totalView: 1 } });
    await WatchHistory.create({ user: profileId, podcast: podcastId });
    return null;
};

const getHomeData = async () => {
    const cacheKey = 'home:data';

    // 1. Try to get cached data
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return JSON.parse(cachedData);
    }
    const [
        categories,
        newestPodcasts,
        popularPodcasts,
        reels,
        albums,
        topCreators,
    ] = await Promise.all([
        Category.find().limit(10),
        Podcast.find().sort({ createdAt: -1 }).limit(10),
        Podcast.find().sort({ totalView: -1 }).limit(10),
        Podcast.find({ duration: { $lte: 120 } })
            .sort({ createdAt: -1 })
            .limit(10),
        Album.find().sort({ updatedAt: -1 }).limit(10),
        Podcast.aggregate([
            {
                $group: {
                    _id: '$creator',
                    totalViews: { $sum: '$totalView' },
                },
            },
            { $sort: { totalViews: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'creators',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'creatorInfo',
                },
            },
            { $unwind: '$creatorInfo' },
            {
                $project: {
                    _id: 0,
                    creatorId: '$_id',
                    totalViews: 1,
                    name: '$creatorInfo.name',
                    email: '$creatorInfo.email',
                    profile_image: '$creatorInfo.profile_image',
                    profile_cover: '$creatorInfo.profile_cover',
                    phone: '$creatorInfo.phone',
                    location: '$creatorInfo.location',
                },
            },
        ]),
    ]);
    const response = {
        categories,
        newestPodcasts,
        popularPodcasts,
        reels,
        albums,
        topCreators,
    };

    await redis.set(cacheKey, JSON.stringify(response), 'EX', 60 * 60);

    return {
        categories,
        newestPodcasts,
        popularPodcasts,
        reels,
        albums,
        topCreators,
    };
};

const podcastService = {
    createPodcastIntoDB,
    updatePodcastIntoDB,
    getAllPodcasts,
    getSinglePodcast,
    deletePodcastFromDB,
    countPodcastView,
    getHomeData,
    getPodcastFeedForUser,
};

export default podcastService;
