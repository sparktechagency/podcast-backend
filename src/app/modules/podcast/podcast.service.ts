/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';
import { CACHE_TTL_SECONDS } from '../../constant';
import AppError from '../../error/appError';
import { createCacheKey } from '../../helper/createCacheKey';
import { deleteFileFromS3 } from '../../helper/deleteFromS3';
import { getCloudFrontUrl } from '../../helper/getCloudFontUrl';
import redis from '../../utilities/redisClient';
import Album from '../album/album.model';
import Bookmark from '../bookmark/bookmark.model';
import Category from '../category/category.model';
import Creator from '../creator/creator.model';
import SubCategory from '../subCategory/subCategory.model';
import { USER_ROLE } from '../user/user.constant';
import WatchHistory from '../watchHistory/watchHistory.model';
import { IPodcast } from './podcast.interface';
import Podcast from './podcast.model';
const createPodcastIntoDB = async (userData: JwtPayload, payload: IPodcast) => {
    const userId = userData.profileId as string;
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

    if (payload.podcast_url) {
        payload.podcast_url = getCloudFrontUrl(payload.podcast_url);
    }

    if (payload.coverImage) {
        payload.coverImage = getCloudFrontUrl(payload.coverImage);
    }

    if (userData.role == USER_ROLE.superAdmin) {
        return await Podcast.create({ ...payload });
    }
    return await Podcast.create({ ...payload, creator: userId });
};

const updatePodcastIntoDB = async (
    userData: JwtPayload,
    id: string,
    payload: Partial<IPodcast>
) => {
    if (userData.role == USER_ROLE.creator) {
        const userId = userData.profileId as string;
        const podcast = await Podcast.findOne({ _id: id, creator: userId });
        if (!podcast) {
            throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
        }

        const reuslt = await Podcast.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });

        if (payload.podcast_url) {
            payload.podcast_url = getCloudFrontUrl(payload.podcast_url);
            deleteFileFromS3(podcast?.podcast_url as string);
        }
        if (payload.podcast_url) {
            payload.podcast_url = getCloudFrontUrl(payload.podcast_url);
            deleteFileFromS3(podcast?.podcast_url as string);
        }

        if (payload.coverImage && podcast?.coverImage) {
            deleteFileFromS3(podcast?.coverImage);
        }

        return reuslt;
    } else {
        const podcast = await Podcast.findOne({
            _id: id,
            station: { $ne: null },
        });
        if (!podcast) {
            throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
        }

        const reuslt = await Podcast.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true,
        });

        if (payload.podcast_url) {
            payload.podcast_url = getCloudFrontUrl(payload.podcast_url);
            deleteFileFromS3(podcast?.podcast_url as string);
        }
        if (payload.podcast_url) {
            payload.podcast_url = getCloudFrontUrl(payload.podcast_url);
            deleteFileFromS3(podcast?.podcast_url as string);
        }

        if (payload.coverImage && podcast?.coverImage) {
            deleteFileFromS3(podcast?.coverImage);
        }

        return reuslt;
    }
};

const getAllPodcasts = async (
    query: Record<string, any>
): Promise<{ meta: any; result: any[] }> => {
    const { page = 1, limit = 10, searchTerm = '' } = query;

    const skip = (Number(page) - 1) * Number(limit);

    const matchStage: any = {};

    // reels filter
    if (query.reels) {
        matchStage.duration = { $lte: 60 };
    }

    const pipeline: any[] = [
        {
            $lookup: {
                from: 'creators',
                localField: 'creator',
                foreignField: '_id',
                as: 'creator',
            },
        },
        { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        },
        { $unwind: '$category' },

        {
            $lookup: {
                from: 'stations',
                localField: 'station',
                foreignField: '_id',
                as: 'station',
            },
        },
        { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'subcategories',
                localField: 'subCategory',
                foreignField: '_id',
                as: 'subCategory',
            },
        },
        { $unwind: '$subCategory' },
        {
            $match: {
                ...matchStage,
                ...(searchTerm
                    ? {
                          $or: [
                              { title: { $regex: searchTerm, $options: 'i' } },
                              {
                                  description: {
                                      $regex: searchTerm,
                                      $options: 'i',
                                  },
                              },
                              { name: { $regex: searchTerm, $options: 'i' } }, // podcast name
                              {
                                  'creator.name': {
                                      $regex: searchTerm,
                                      $options: 'i',
                                  },
                              }, // creator name
                          ],
                      }
                    : {}),
            },
        },
        {
            $facet: {
                meta: [{ $count: 'total' }],
                result: [
                    { $sort: { createdAt: -1 } }, // or use query.sort if provided
                    { $skip: skip },
                    { $limit: Number(limit) },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            title: 1,
                            description: 1,
                            coverImage: 1,
                            podcast_url: 1,
                            address: 1,
                            tags: 1,
                            totalView: 1,
                            duration: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            location: 1,
                            category: { _id: 1, name: 1 },
                            subCategory: { _id: 1, name: 1 },
                            station: { _id: 1, name: 1, profile_image: 1 },
                            creator: {
                                _id: 1,
                                name: 1,
                                profile_image: 1,
                                donationLink: 1,
                            },
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                meta: {
                    $let: {
                        vars: { m: { $arrayElemAt: ['$meta', 0] } },
                        in: {
                            page: Number(page),
                            limit: Number(limit),
                            total: { $ifNull: ['$$m.total', 0] },
                            totalPage: {
                                $ceil: {
                                    $divide: [
                                        { $ifNull: ['$$m.total', 0] },
                                        Number(limit),
                                    ],
                                },
                            },
                        },
                    },
                },
            },
        },
    ];

    const result = await Podcast.aggregate(pipeline);

    return {
        meta: result[0]?.meta || {
            page: Number(page),
            limit: Number(limit),
            total: 0,
            totalPage: 0,
        },
        result: result[0]?.result || [],
    };
};
const getMyPodcasts = async (
    userData: JwtPayload,
    query: Record<string, unknown>
) => {
    if (userData.role == USER_ROLE.creator) {
        const profileId = userData.profileId;
        const cacheKey = `user:${profileId}:${createCacheKey(query)}`;

        // 1. Try to get cached data from Redis
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            // Cache hit - parse and return
            return JSON.parse(cachedData);
        }

        const filterQuery: any = {};
        if (query.reels) {
            filterQuery.duration = { $lte: 60 };
            delete query.reels;
        }

        if (query.popular) {
            query.sort = '-totalView';
            delete query.popular;
        }

        const resultQuery = new QueryBuilder(
            Podcast.find({ ...filterQuery, creator: profileId }).populate([
                { path: 'creator', select: 'name profile_image' },
                { path: 'category', select: 'name' },
                { path: 'subCategory', select: 'name' },
            ]),
            query
        )
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
    } else {
        const filterQuery: any = {};
        if (query.reels) {
            filterQuery.duration = { $lte: 60 };
            delete query.reels;
        }

        if (query.popular) {
            query.sort = '-totalView';
            delete query.popular;
        }

        const resultQuery = new QueryBuilder(
            Podcast.find({ ...filterQuery, station: { $ne: null } }).populate([
                // { path: 'creator', select: 'name profile_image' },
                { path: 'station', select: 'name profile_image donationLink' },
                { path: 'category', select: 'name' },
                { path: 'subCategory', select: 'name' },
            ]),
            query
        )
            .search(['name', 'title', 'description'])
            .fields()
            .filter()
            .paginate()
            .sort();

        const result = await resultQuery.modelQuery;
        const meta = await resultQuery.countTotal();
        const dataToCache = { meta, result };

        return dataToCache;
    }
};

// for randomize ===================================

export const getPodcastFeedForUser = async (
    userId: string,
    query: Record<string, unknown>
) => {
    const limit = Math.min(Number(query.limit) || 20, 50);
    const firstPodcastId = query.firstPodcastId as string;
    const lastId = query.lastId as string | undefined; // for smooth scroll

    if (!firstPodcastId) throw new Error('firstPodcastId is required');

    // Step 0: Cache bookmarks & likes
    const [cachedBookmarks, cachedLikes] = await Promise.all([
        redis.get(`bookmarks:${userId}`),
        redis.get(`likes:${userId}`),
    ]);

    const bookmarkedPodcastIds = cachedBookmarks
        ? new Set(JSON.parse(cachedBookmarks))
        : new Set(
              (
                  await Bookmark.find({ user: userId }).select('podcast').lean()
              ).map((b) => b.podcast.toString())
          );

    const likedPodcastIds = cachedLikes
        ? new Set(JSON.parse(cachedLikes))
        : new Set(
              (
                  await Podcast.find({ 'likers.user': userId })
                      .select('_id')
                      .lean()
              ).map((l) => l._id.toString())
          );

    // Update Redis if empty
    if (!cachedBookmarks) {
        await redis.set(
            `bookmarks:${userId}`,
            JSON.stringify([...bookmarkedPodcastIds]),
            'EX',
            600
        );
    }
    if (!cachedLikes) {
        await redis.set(
            `likes:${userId}`,
            JSON.stringify([...likedPodcastIds]),
            'EX',
            600
        );
    }

    // Step 1: Fetch first podcast
    const firstPodcast = await Podcast.findById(firstPodcastId)
        .populate('category', 'name')
        .populate('subCategory', 'name')
        .populate('creator', 'name donationLink profile_image')
        .populate('station', 'name profile_image donationLink')
        .lean();

    if (!firstPodcast) throw new Error('First podcast not found');

    // Step 2: Aggregate podcasts
    let podcastsAgg = await Podcast.aggregate([
        {
            $match: {
                _id: { $ne: new mongoose.Types.ObjectId(firstPodcastId) },
                ...(lastId
                    ? { _id: { $lt: new mongoose.Types.ObjectId(lastId) } }
                    : {}),
            },
        },
        {
            $facet: {
                categoryPodcasts: [
                    {
                        $match: {
                            category: firstPodcast.category._id,
                            // subCategory: firstPodcast.subCategory._id, //TODO: need to work if want also match sub category
                        },
                    },
                    { $sample: { size: limit } },
                ],
                fallbackPodcasts: [
                    { $sample: { size: limit } }, // random fallback
                ],
            },
        },
        {
            $project: {
                podcasts: {
                    $concatArrays: [
                        '$categoryPodcasts',
                        {
                            $slice: [
                                '$fallbackPodcasts',
                                {
                                    $subtract: [
                                        limit,
                                        { $size: '$categoryPodcasts' },
                                    ],
                                },
                                limit,
                            ],
                        },
                    ],
                },
            },
        },
        { $unwind: '$podcasts' },
        { $replaceRoot: { newRoot: '$podcasts' } },
        {
            $lookup: {
                from: 'users',
                localField: 'creator',
                foreignField: '_id',
                as: 'creator',
            },
        },
        { $unwind: { path: '$creator', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'stations',
                localField: 'station',
                foreignField: '_id',
                as: 'station',
            },
        },
        { $unwind: { path: '$station', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
            },
        },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'subcategories',
                localField: 'subCategory',
                foreignField: '_id',
                as: 'subCategory',
            },
        },
        { $unwind: { path: '$subCategory', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                title: 1,
                coverImage: 1,
                podcast_url: 1,
                category: { name: 1 },
                subCategory: { name: 1 },
                location: 1,
                duration: 1,
                createdAt: 1,
                creator: { name: 1, donationLink: 1, profile_image: 1 },
                station: { name: 1, profile_image: 1, donationLink: 1 },
            },
        },
        { $limit: limit },
    ]);

    // Step 3: Ensure always data is returned
    if (podcastsAgg.length === 0) {
        podcastsAgg = Array(limit).fill(firstPodcast); // repeat first podcast if empty
    }

    // Step 4: Prepend first podcast if first page
    const podcasts = !lastId
        ? [
              firstPodcast,
              ...podcastsAgg.filter(
                  (p) => p._id.toString() !== firstPodcast._id.toString()
              ),
          ]
        : podcastsAgg;

    // Step 5: Add flags
    const podcastsWithFlags = podcasts.map((p) => ({
        ...p,
        isBookmark: bookmarkedPodcastIds.has(p._id.toString()),
        isLike: likedPodcastIds.has(p._id.toString()),
    }));

    // Step 6: Prepare next cursor
    const nextCursor = podcastsWithFlags.length
        ? podcastsWithFlags[podcastsWithFlags.length - 1]._id
        : null;

    return {
        podcasts: podcastsWithFlags,
        nextCursor,
        hasMore: true, // endless scroll
    };
};

const getSinglePodcast = async (id: string) => {
    const podcast = await Podcast.findById(id).populate([
        {
            path: 'creator',
            select: 'name profile_image',
        },
        {
            path: 'station',
            select: 'name profile_image donationLink',
        },
        {
            path: 'category',
            select: 'name',
        },
        {
            path: 'subCategory',
            select: 'name',
        },
    ]);
    if (!podcast) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
    }

    return podcast;
};

const deletePodcastFromDB = async (userData: JwtPayload, id: string) => {
    if (userData.role == USER_ROLE.creator) {
        const userId = userData.profileId as string;
        const podcast = await Podcast.findOne({ _id: id, creator: userId });
        if (!podcast) {
            throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
        }
        if (podcast.podcast_url) {
            podcast.podcast_url = getCloudFrontUrl(podcast.podcast_url);
            deleteFileFromS3(podcast?.podcast_url);
        }
        if (podcast.podcast_url) {
            podcast.podcast_url = getCloudFrontUrl(podcast.podcast_url);
            deleteFileFromS3(podcast?.podcast_url);
        }
        return await Podcast.findByIdAndDelete(id);
    } else {
        const podcast = await Podcast.findOne({
            _id: id,
            station: { $ne: null },
        });
        if (!podcast) {
            throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
        }
        if (podcast.podcast_url) {
            podcast.podcast_url = getCloudFrontUrl(podcast.podcast_url);
            deleteFileFromS3(podcast?.podcast_url);
        }
        if (podcast.podcast_url) {
            podcast.podcast_url = getCloudFrontUrl(podcast.podcast_url);
            deleteFileFromS3(podcast?.podcast_url);
        }
        return await Podcast.findByIdAndDelete(id);
    }
};

const countPodcastView = async (profileId: string, podcastId: string) => {
    await Podcast.findByIdAndUpdate(podcastId, { $inc: { totalView: 1 } });

    await WatchHistory.findOneAndUpdate(
        { user: profileId, podcast: podcastId },
        { $set: { updatedAt: new Date() } },
        { upsert: true, new: true }
    );

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
        Podcast.find()
            .populate({ path: 'category', select: 'name' })
            .populate('subCategory', 'name')
            .populate('creator', 'name profile_image')
            .populate('station', 'name profile_image')
            .sort({ createdAt: -1 })
            .limit(10),
        Podcast.find()
            .populate({ path: 'category', select: 'name' })
            .populate('subCategory', 'name')
            .populate('creator', 'name profile_image')
            .populate('station', 'name profile_image')

            .sort({ totalView: -1 })
            .limit(10),
        Podcast.find({ duration: { $lte: 120 } })
            .populate({ path: 'category', select: 'name' })
            .populate('subCategory', 'name')
            .populate('creator', 'name profile_image')
            .populate('station', 'name profile_image')
            .sort({ createdAt: -1 })
            .limit(10),
        Album.find().sort({ updatedAt: -1 }).limit(10),
        // Podcast.aggregate([
        //     {
        //         $group: {
        //             _id: '$creator',
        //             totalViews: { $sum: '$totalView' },
        //         },
        //     },
        //     { $sort: { totalViews: -1 } },
        //     { $limit: 10 },
        //     {
        //         $lookup: {
        //             from: 'creators',
        //             localField: '_id',
        //             foreignField: '_id',
        //             as: 'creatorInfo',
        //         },
        //     },
        //     { $unwind: '$creatorInfo' },
        //     {
        //         $lookup: {
        //             from: 'podcasts',
        //             localField: '_id',
        //             foreignField: 'creator',
        //             as: 'creatorPodcasts',
        //         },
        //     },
        //     {
        //         $addFields: {
        //             latestPodcast: {
        //                 $arrayElemAt: [
        //                     {
        //                         $sortArray: {
        //                             input: '$creatorPodcasts',
        //                             sortBy: { createdAt: -1 },
        //                         },
        //                     }, // Sort podcasts by createdAt descending
        //                     0, // Take the first element (most recent podcast)
        //                 ],
        //             },
        //         },
        //     },
        //     {
        //         $project: {
        //             _id: 0,
        //             creatorId: '$_id',
        //             totalViews: 1,
        //             name: '$creatorInfo.name',
        //             email: '$creatorInfo.email',
        //             profile_image: '$creatorInfo.profile_image',
        //             profile_cover: '$creatorInfo.profile_cover',
        //             phone: '$creatorInfo.phone',
        //             location: '$creatorInfo.location',
        //             donationLink: '$creatorInfo.donationLink',
        //             randomPodcast: {
        //                 title: '$randomPodcast.title',
        //                 description: '$randomPodcast.description',
        //                 podcast_url: '$randomPodcast.podcast_url',
        //                 coverImage: '$randomPodcast.coverImage',
        //             },
        //         },
        //     },
        // ]),

        Creator.aggregate([
            // Lookup active live session
            {
                $lookup: {
                    from: 'livesessions',
                    let: { creatorId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$creator', '$$creatorId'] },
                                        { $eq: ['$status', 'active'] }, // ENUM_LIVE_SESSION.ACTIVE
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'liveSession',
                },
            },
            {
                $addFields: {
                    isLive: { $gt: [{ $size: '$liveSession' }, 0] },
                    liveSession: { $arrayElemAt: ['$liveSession', 0] },
                },
            },

            // Lookup stream room if live
            {
                $lookup: {
                    from: 'streamrooms',
                    localField: 'liveSession.streamRoom',
                    foreignField: '_id',
                    as: 'streamRoom',
                },
            },
            {
                $unwind: {
                    path: '$streamRoom',
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Lookup podcasts for total views
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
                    totalViews: { $sum: '$creatorPodcasts.totalView' },
                    latestPodcast: {
                        $arrayElemAt: [
                            {
                                $sortArray: {
                                    input: '$creatorPodcasts',
                                    sortBy: { createdAt: -1 },
                                },
                            },
                            0,
                        ],
                    },
                },
            },

            // Sort: live first, then by totalViews
            {
                $sort: { isLive: -1, totalViews: -1 },
            },

            // Select fields
            {
                $project: {
                    // _id: 0,
                    creatorId: '$_id',
                    name: 1,
                    email: 1,
                    profile_image: 1,
                    profile_cover: 1,
                    phone: 1,
                    location: 1,
                    donationLink: 1,
                    isLive: 1,
                    totalViews: 1,
                    liveSession: {
                        session_id: '$liveSession.session_id',
                        name: '$liveSession.name',
                        description: '$liveSession.description',
                        coverImage: '$liveSession.coverImage',
                        session_started_at: '$liveSession.session_started_at',
                        duration: '$liveSession.duration',
                    },
                    streamRoom: 1,
                    latestPodcast: {
                        _id: '$latestPodcast._id',
                        title: '$latestPodcast.title',
                        description: '$latestPodcast.description',
                        podcast_url: '$latestPodcast.podcast_url',
                        coverImage: '$latestPodcast.coverImage',
                    },
                },
            },

            // Pagination
            {
                $limit: 10,
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

const getPodcastForSubcategories = async (categoryId: string) => {
    const cacheKey = `subcat-podcast:${categoryId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    console.log('Fetching from DB for subcategories podcasts');

    const result = await SubCategory.aggregate([
        {
            $match: {
                category: new mongoose.Types.ObjectId(categoryId),
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: 'podcasts',
                let: {
                    subCatId: '$_id',
                    categoryId: '$category',
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$subCategory', '$$subCatId'] },
                                    { $eq: ['$category', '$$categoryId'] },
                                ],
                            },
                        },
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 10 },
                    // Lookup for creator
                    {
                        $lookup: {
                            from: 'creators',
                            localField: 'creator',
                            foreignField: '_id',
                            as: 'creator',
                        },
                    },
                    {
                        $unwind: {
                            path: '$creator',
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    // Lookup for category
                    {
                        $lookup: {
                            from: 'categories',
                            localField: 'category',
                            foreignField: '_id',
                            as: 'category',
                        },
                    },
                    {
                        $unwind: '$category',
                    },
                    // Lookup for subCategory
                    {
                        $lookup: {
                            from: 'subcategories',
                            localField: 'subCategory',
                            foreignField: '_id',
                            as: 'subCategory',
                        },
                    },
                    {
                        $unwind: '$subCategory',
                    },
                    {
                        $project: {
                            title: 1,
                            coverImage: 1,
                            podcast_url: 1,
                            duration: 1,
                            createdAt: 1,
                            location: 1,
                            'creator._id': 1,
                            'creator.name': 1,
                            'category._id': 1,
                            'category.name': 1,
                            'subCategory._id': 1,
                            'subCategory.name': 1,
                        },
                    },
                ],
                as: 'podcasts',
            },
        },
        {
            $project: {
                _id: 1,
                name: 1,
                image: 1,
                podcasts: 1,
            },
        },
    ]);

    // 3. Cache result in Redis (expire in 5 minutes)
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);

    return result;
};

const toggleLikePodcast = async (podcastId: string, userData: JwtPayload) => {
    const userId = userData.profileId;
    const userType =
        userData.role == USER_ROLE.creator ? 'Creator' : 'NormalUser';
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
        throw new Error('Podcast not found');
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const isLiked = podcast.likers.some(
        (liker: any) =>
            liker.user.equals(userObjectId) && liker.userType === userType
    );

    if (isLiked) {
        await Podcast.findByIdAndUpdate(podcastId, {
            $pull: { likers: { user: userObjectId, userType } },
        });
        return { isLike: false };
    } else {
        await Podcast.findByIdAndUpdate(podcastId, {
            $push: { likers: { user: userObjectId, userType } },
        });
        return { isLike: true };
    }
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
    getPodcastForSubcategories,
    getMyPodcasts,
    toggleLikePodcast,
};

export default podcastService;
