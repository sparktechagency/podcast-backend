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

    return await Podcast.findByIdAndDelete(id);
};

const countPodcastView = async (profileId: string, podcastId: string) => {
    await Podcast.findByIdAndUpdate(podcastId, { $inc: { totalView: 1 } });
    await WatchHistory.create({ user: profileId, podcast: podcastId });
    return null;
};

const getHomeData = async () => {
    const [categories, newestPodcasts, popularPodcasts, reels, albums] =
        await Promise.all([
            Category.find().limit(10),
            Podcast.find().sort({ createdAt: -1 }).limit(10),
            Podcast.find().sort({ totalView: -1 }).limit(10),
            Podcast.find({ duration: { $lte: 120 } })
                .sort({ createdAt: -1 })
                .limit(10),
            Album.find().sort({ updatedAt: -1 }).limit(10),
        ]);

    return {
        categories,
        newestPodcasts,
        popularPodcasts,
        reels,
        albums,
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
};

export default podcastService;
