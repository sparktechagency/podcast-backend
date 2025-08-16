import httpStatus from 'http-status';
import AppError from '../../error/appError';
import { ICreator } from './creator.interface';
import Creator from './creator.model';
import QueryBuilder from '../../builder/QueryBuilder';
import Podcast from '../podcast/podcast.model';
import { createCacheKey } from '../../helper/createCacheKey';
import redis from '../../utilities/redisClient';
import { User } from '../user/user.model';

const updateCreatorProfile = async (id: string, payload: Partial<ICreator>) => {
    const creator = await Creator.findById(id);
    if (!creator) {
        throw new AppError(httpStatus.NOT_FOUND, 'Creator profile not found');
    }

    const result = await Creator.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });

    return result;
};

const getSingleCreator = async (id: string) => {
    const creator = await Creator.findById(id);
    if (!creator) {
        throw new AppError(httpStatus.NOT_FOUND, 'Creator not found');
    }

    return creator;
};

const getAllCreators = async (query: Record<string, unknown>) => {
    const cacheKey = `all-creators:${createCacheKey(query)}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        // Cache hit - parse and return
        return JSON.parse(cachedData);
    }
    const resultQuery = new QueryBuilder(
        Creator.find().populate('user', 'isBlocked'),
        query
    )
        .search(['name', 'email'])
        .fields()
        .filter()
        .paginate()
        .sort();

    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();
    const dataToCache = { meta, result };
    await redis.set(cacheKey, JSON.stringify(dataToCache), 'EX', 60 * 10);
    return {
        meta,
        result,
    };
};

const getTopCreators = async (query: Record<string, unknown>) => {
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = createCacheKey(query) || `top-creators:${page}-${limit}`;

    // 1. Try to get cached data from Redis
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        // Cache hit - parse and return
        return JSON.parse(cachedData);
    }

    const topCreators = await Podcast.aggregate([
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
            $lookup: {
                from: 'podcasts',
                localField: '_id',
                foreignField: 'creator',
                as: 'creatorPodcasts',
            },
        },
        {
            $addFields: {
                latestPodcast: {
                    $arrayElemAt: [
                        {
                            $sortArray: {
                                input: '$creatorPodcasts',
                                sortBy: { createdAt: -1 },
                            },
                        }, // Sort podcasts by createdAt descending
                        0, // Take the first element (most recent podcast)
                    ],
                },
            },
        },
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
                donationLink: '$creatorInfo.donationLink',
                randomPodcast: {
                    title: '$randomPodcast.title',
                    description: '$randomPodcast.description',
                    podcast_url: '$randomPodcast.podcast_url',
                    coverImage: '$randomPodcast.coverImage',
                },
            },
        },
        {
            $facet: {
                result: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'total' }],
            },
        },
    ]);

    const result = topCreators[0]?.result || [];
    const total = topCreators[0]?.totalCount[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    const meta = {
        page,
        limit,
        total,
        totalPage,
    };

    const dataToCache = { meta, result };

    // 3. Store result in Redis cache with TTL
    await redis.set(cacheKey, JSON.stringify(dataToCache), 'EX', 60 * 60);

    return {
        meta,
        result,
    };
};

const approveRejectCreator = async (id: string, isApproved: boolean) => {
    const creator = await Creator.findById(id);
    if (!creator) {
        throw new AppError(httpStatus.NOT_FOUND, 'Creator not found');
    }
    if (isApproved) {
        const result = await Creator.findByIdAndUpdate(
            id,
            { isApproved: true },
            { new: true, runValidators: true }
        );
        return result;
    } else if (isApproved == false) {
        await Creator.findByIdAndDelete(id);
        await User.deleteOne({ _id: creator.user });
        return null;
    } else {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Invalid approval status, you need to pass true or false'
        );
    }
};

const CreatorService = {
    updateCreatorProfile,
    getSingleCreator,
    getAllCreators,
    approveRejectCreator,
    getTopCreators,
};

export default CreatorService;
