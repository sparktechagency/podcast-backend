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

const createPodcastIntoDB = async (userId: string, payload: IPodcast) => {
    console.log('payload', payload);
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

const getPodcastFeedForUser = async (
    userId: string,
    query: Record<string, unknown>
) => {
    // 1. If no category/subcategory provided, try to use the last watched one
    if (!query.category || !query.subCategory) {
        const lastWatched: any = await WatchHistory.findOne({
            user: userId,
        })
            .populate({ path: 'podcast', select: 'category subcategory' })
            .sort({ watchedAt: -1 });

        query.category =
            query.category || lastWatched?.podcast.category?.toString();
        query.subCategory =
            query.subCategory || lastWatched?.podcast?.subCategory?.toString();
    }

    // 2. Find already watched podcast ids
    const watchedPodcastIds = await WatchHistory.find({
        user: userId,
    }).distinct('podcast');

    const resultQuery = new QueryBuilder(
        Podcast.find({ _id: { $nin: watchedPodcastIds } }),
        query
    )
        .search(['name', 'title', 'description'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();

    return {
        meta,
        result,
    };
};

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
