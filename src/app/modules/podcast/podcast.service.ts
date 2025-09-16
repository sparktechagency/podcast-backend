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

    if (payload.podcast_url) {
        payload.podcast_url = getCloudFrontUrl(payload.podcast_url);
    }

    // if (payload.podcast_url) {
    //     const rawKey = payload.podcast_url.replace(/^https?:\/\/[^/]+\/?/, '');
    //     console.log('raw key', rawKey);
    //     const hlsUrl = await startMediaConvertJob(rawKey);

    //     // Replace podcast_url with HLS URL
    //     payload.podcast_url = hlsUrl;
    // }

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
};

// const getAllPodcasts = async (query: Record<string, unknown>) => {
//     const cacheKey = createCacheKey(query);

//     // 1. Try to get cached data from Redis
//     const cachedData = await redis.get(cacheKey);
//     if (cachedData) {
//         // Cache hit - parse and return
//         return JSON.parse(cachedData);
//     }

//     const filterQuery: any = {};
//     if (query.reels) {
//         filterQuery.duration = { $lte: 60 };
//         delete query.reels;
//     }

//     if (query.popular) {
//         query.sort = '-totalView';
//         delete query.popular;
//     }

//     const resultQuery = new QueryBuilder(
//         Podcast.find({ ...filterQuery }).populate([
//             { path: 'creator', select: 'name profile_image donationLink' },
//             { path: 'category', select: 'name' },
//             { path: 'subCategory', select: 'name' },
//         ]),
//         query
//     )
//         .search(['name', 'title', 'description'])
//         .fields()
//         .filter()
//         .paginate()
//         .sort();

//     const result = await resultQuery.modelQuery;
//     const meta = await resultQuery.countTotal();
//     const dataToCache = { meta, result };

//     // 3. Store result in Redis cache with TTL
//     await redis.set(
//         cacheKey,
//         JSON.stringify(dataToCache),
//         'EX',
//         CACHE_TTL_SECONDS
//     );

//     return dataToCache;
// };

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
        { $unwind: '$creator' },
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
    profileId: string,
    query: Record<string, unknown>
) => {
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
};

// const getPodcastFeedForUser = async (
//     userId: string,
//     query: Record<string, unknown>
// ) => {
//     const page = Number(query.page) || 1;
//     const limit = Number(query.limit) || 20;
//     const skip = (page - 1) * limit;

//     const lng = (query.lng as number) || undefined;
//     const lat = (query.lat as number) || undefined;
//     const categoryId = query.category as string | undefined;
//     const subCategoryId = query.subCategory as string | undefined;
//     const searchTerm = query.searchTerm as string | undefined;

//     // Step 2: Parallel Redis get for liked pods & bookmarks+watched caches
//     const [cachedLikedPods, cachedBookmarksAndWatched] = await Promise.all([
//         redis.get(`likedPods:${userId}`),
//         redis.get(`bookmarksAndWatched:${userId}`),
//     ]);

//     let likedPods: any[] = [];
//     if (cachedLikedPods) {
//         likedPods = JSON.parse(cachedLikedPods);
//     } else {
//         likedPods = await Podcast.find({ 'likers.user': userId })
//             .select('category subCategory')
//             .limit(50)
//             .lean();
//         await redis.set(
//             `likedPods:${userId}`,
//             JSON.stringify(likedPods),
//             'EX',
//             300
//         );
//     }

//     let bookmarks: any[] = [];
//     let watched: any[] = [];
//     if (cachedBookmarksAndWatched) {
//         const parsed = JSON.parse(cachedBookmarksAndWatched);
//         bookmarks = parsed.bookmarks || [];
//         watched = parsed.watched || [];
//     } else {
//         [bookmarks, watched] = await Promise.all([
//             Bookmark.find({ user: userId }).select('podcast').lean(),
//             WatchHistory.find({ user: userId }).select('podcast').lean(),
//         ]);
//         await redis.set(
//             `bookmarksAndWatched:${userId}`,
//             JSON.stringify({ bookmarks, watched }),
//             'EX',
//             300
//         );
//     }

//     const bookmarkedPodcastIds = new Set(
//         bookmarks.map((b) => b.podcast.toString())
//     );
//     const watchedIds = watched.map((w) => w.podcast.toString());

//     // Step 3: Prepare top categories & subCategories for personalization
//     const topCategories = [
//         ...new Set(likedPods.map((p) => p.category?.toString())),
//     ];
//     const topSubCategories = [
//         ...new Set(likedPods.map((p) => p.subCategory?.toString())),
//     ];

//     // Step 4: Build main Mongo query object with filters & personalization
//     const queryData: any = {
//         _id: { $nin: watchedIds },
//         $and: [],
//     };

//     if (
//         typeof lat === 'number' &&
//         !isNaN(lat) &&
//         typeof lng === 'number' &&
//         !isNaN(lng)
//     ) {
//         queryData.location = {
//             $nearSphere: {
//                 $geometry: { type: 'Point', coordinates: [lng, lat] },
//                 $maxDistance: 100 * 1000, // 100 km radius
//             },
//         };
//     }

//     if (categoryId) queryData.$and.push({ category: categoryId });
//     if (subCategoryId) queryData.$and.push({ subCategory: subCategoryId });
//     if (searchTerm)
//         queryData.$and.push({ title: { $regex: new RegExp(searchTerm, 'i') } });
//     if (query.reels) queryData.$and.push({ duration: { $lte: 60 } });

//     if (!categoryId && !subCategoryId && !searchTerm) {
//         const ors = [];
//         if (topCategories.length)
//             ors.push({ category: { $in: topCategories } });
//         if (topSubCategories.length)
//             ors.push({ subCategory: { $in: topSubCategories } });
//         if (ors.length) queryData.$and.push({ $or: ors });
//     }

//     if (queryData.$and.length === 0) delete queryData.$and;

//     const sortField = query.popular ? 'totalView' : 'createdAt';

//     // Step 5: Query podcasts with minimal fields and minimal population
//     const podcasts: any = await Podcast.find(queryData)
//         .sort({ [sortField]: -1 })
//         .skip(skip)
//         .limit(limit)
//         .select(
//             'title coverImage podcast_url category subCategory location duration createdAt creator'
//         )
//         .populate('category', 'name') // only name & _id
//         .populate('subCategory', 'name') // only name & _id
//         .populate('creator', 'name') // only name & _id
//         .lean();

//     // Step 6: Optional firstPodcastId logic: fetch separately and add on top
//     if (query.firstPodcastId) {
//         const firstPodcast = await Podcast.findById(query.firstPodcastId)
//             .select(
//                 'title coverImage podcast_url category subCategory location duration createdAt creator'
//             )
//             .populate('category', 'name')
//             .populate('subCategory', 'name')
//             .populate('creator', 'name')
//             .lean();
//         if (firstPodcast) {
//             const isBookmarked = bookmarkedPodcastIds.has(
//                 firstPodcast._id.toString()
//             );
//             podcasts.unshift({ ...firstPodcast, isBookmark: isBookmarked });
//         }
//     }

//     // Step 7: Add bookmark + like flag to each podcast
//     const likedPodcastIds = new Set(likedPods.map((p) => p._id?.toString()));

//     const podcastsWithFlags = podcasts.map((podcast: any) => ({
//         ...podcast,
//         isBookmark: bookmarkedPodcastIds.has(podcast._id.toString()),
//         isLike: likedPodcastIds.has(podcast._id.toString()),
//     }));

//     // Step 8: Pagination info
//     const totalPodcasts = await Podcast.countDocuments(queryData);
//     const totalPages = Math.ceil(totalPodcasts / limit);

//     const response = {
//         podcasts: podcastsWithFlags,
//         page,
//         limit,
//         totalPages,
//         totalPodcasts,
//         hasMore: page < totalPages,
//     };

//     return response;
// };

const getPodcastFeedForUser = async (
    userId: string,
    query: Record<string, unknown>
) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const lng = (query.lng as number) || undefined;
    const lat = (query.lat as number) || undefined;
    const categoryId = query.category as string | undefined;
    const subCategoryId = query.subCategory as string | undefined;
    const searchTerm = query.searchTerm as string | undefined;

    // Step 1: Redis caches
    const [cachedLikedPods, cachedBookmarksAndWatched] = await Promise.all([
        redis.get(`likedPods:${userId}`),
        redis.get(`bookmarksAndWatched:${userId}`),
    ]);

    let likedPods: any[] = [];
    if (cachedLikedPods) {
        likedPods = JSON.parse(cachedLikedPods);
    } else {
        likedPods = await Podcast.find({ 'likers.user': userId })
            .select('category subCategory')
            .limit(50)
            .lean();
        await redis.set(
            `likedPods:${userId}`,
            JSON.stringify(likedPods),
            'EX',
            300
        );
    }

    let bookmarks: any[] = [];
    let watched: any[] = [];
    if (cachedBookmarksAndWatched) {
        const parsed = JSON.parse(cachedBookmarksAndWatched);
        bookmarks = parsed.bookmarks || [];
        watched = parsed.watched || [];
    } else {
        [bookmarks, watched] = await Promise.all([
            Bookmark.find({ user: userId }).select('podcast').lean(),
            WatchHistory.find({ user: userId }).select('podcast').lean(),
        ]);
        await redis.set(
            `bookmarksAndWatched:${userId}`,
            JSON.stringify({ bookmarks, watched }),
            'EX',
            300
        );
    }

    const bookmarkedPodcastIds = new Set(
        bookmarks.map((b) => b.podcast.toString())
    );
    const watchedIds = watched.map((w) => w.podcast.toString());

    const topCategories = [
        ...new Set(likedPods.map((p) => p.category?.toString())),
    ];
    const topSubCategories = [
        ...new Set(likedPods.map((p) => p.subCategory?.toString())),
    ];

    // Step 2: Build query
    const queryData: any = {
        _id: { $nin: watchedIds },
        $and: [],
    };
    //=----
    if (
        typeof lat === 'number' &&
        !isNaN(lat) &&
        typeof lng === 'number' &&
        !isNaN(lng)
    ) {
        queryData.location = {
            $nearSphere: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: 100 * 1000,
            },
        };
    }

    if (categoryId) queryData.$and.push({ category: categoryId });
    if (subCategoryId) queryData.$and.push({ subCategory: subCategoryId });
    if (searchTerm)
        queryData.$and.push({ title: { $regex: new RegExp(searchTerm, 'i') } });
    if (query.reels) queryData.$and.push({ duration: { $lte: 60 } });

    if (!categoryId && !subCategoryId && !searchTerm) {
        const ors = [];
        if (topCategories.length)
            ors.push({ category: { $in: topCategories } });
        if (topSubCategories.length)
            ors.push({ subCategory: { $in: topSubCategories } });
        if (ors.length) queryData.$and.push({ $or: ors });
    }

    if (queryData.$and.length === 0) delete queryData.$and;

    const sortField = query.popular ? 'totalView' : 'createdAt';

    // Step 3: Query personalized podcasts
    let podcasts: any = await Podcast.find(queryData)
        .sort({ [sortField]: -1 })
        .skip(skip)
        .limit(limit)
        .select(
            'title coverImage podcast_url category subCategory location duration createdAt creator'
        )
        .populate('category', 'name')
        .populate('subCategory', 'name')
        .populate('creator', 'name donationLink profile_image')
        .lean();

    let isFallback = false;

    // Step 4: Fallback if no results → random unwatched
    if (!podcasts.length) {
        isFallback = true;
        podcasts = await Podcast.aggregate([
            { $match: { _id: { $nin: watchedIds } } },
            { $sample: { size: limit } },
            {
                $project: {
                    title: 1,
                    coverImage: 1,
                    podcast_url: 1,
                    category: 1,
                    subCategory: 1,
                    location: 1,
                    duration: 1,
                    createdAt: 1,
                    creator: 1,
                },
            },
        ]);

        // populate after aggregation
        podcasts = await Podcast.populate(podcasts, [
            { path: 'category', select: 'name' },
            { path: 'subCategory', select: 'name' },
            { path: 'creator', select: 'name donationLink profile_image' },
        ]);
    }

    // Step 5: firstPodcastId handling
    if (query.firstPodcastId) {
        const firstPodcast = await Podcast.findById(query.firstPodcastId)
            .select(
                'title coverImage podcast_url category subCategory location duration createdAt creator'
            )
            .populate('category', 'name')
            .populate('subCategory', 'name')
            .populate('creator', 'name donationLink profile_image')
            .lean();
        if (firstPodcast) {
            const isBookmarked = bookmarkedPodcastIds.has(
                firstPodcast._id.toString()
            );
            podcasts.unshift({ ...firstPodcast, isBookmark: isBookmarked });
        }
    }

    // Step 6: Add flags
    const likedPodcastIds = new Set(likedPods.map((p) => p._id?.toString()));
    const podcastsWithFlags = podcasts.map((podcast: any) => ({
        ...podcast,
        isBookmark: bookmarkedPodcastIds.has(podcast._id.toString()),
        isLike: likedPodcastIds.has(podcast._id.toString()),
    }));

    // Step 7: Pagination info
    let totalPodcasts = 0;
    let totalPages = 0;
    if (!isFallback) {
        totalPodcasts = await Podcast.countDocuments(queryData);
        totalPages = Math.ceil(totalPodcasts / limit);
    } else {
        // fallback: just approximate
        totalPodcasts = podcasts.length;
        totalPages = 1;
    }

    return {
        podcasts: podcastsWithFlags,
        page,
        limit,
        totalPages,
        totalPodcasts,
        hasMore: page < totalPages,
    };
};

// for randomize ===================================
// const getPodcastFeedForUser = async (
//     userId: string,
//     query: Record<string, unknown>
// ) => {
//     const page = Number(query.page) || 1;
//     const limit = Number(query.limit) || 20;
//     const skip = (page - 1) * limit;

//     const categoryId = query.category as string | undefined;
//     const subCategoryId = query.subCategory as string | undefined;
//     const searchTerm = query.searchTerm as string | undefined;

//     // --- Filters ---
//     const filters: any = {};
//     if (categoryId) filters.category = new mongoose.Types.ObjectId(categoryId);
//     if (subCategoryId)
//         filters.subCategory = new mongoose.Types.ObjectId(subCategoryId);
//     if (searchTerm) filters.title = { $regex: new RegExp(searchTerm, 'i') };
//     if (query.reels) filters.duration = { $lte: 60 };

//     // --- Aggregation ---
//     const result = await Podcast.aggregate([
//         { $match: filters },

//         {
//             $facet: {
//                 metadata: [
//                     { $count: 'totalPodcasts' }, // count total
//                     {
//                         $addFields: {
//                             page,
//                             limit,
//                             totalPages: {
//                                 $ceil: {
//                                     $divide: ['$totalPodcasts', limit],
//                                 },
//                             },
//                             hasMore: {
//                                 $lt: [
//                                     page,
//                                     {
//                                         $ceil: {
//                                             $divide: ['$totalPodcasts', limit],
//                                         },
//                                     },
//                                 ],
//                             },
//                         },
//                     },
//                 ],
//                 podcasts: [
//                     { $sample: { size: limit * 5 } }, // over-sample for randomness
//                     { $skip: skip },
//                     { $limit: limit },

//                     // category
//                     {
//                         $lookup: {
//                             from: 'categories',
//                             localField: 'category',
//                             foreignField: '_id',
//                             as: 'category',
//                         },
//                     },
//                     {
//                         $unwind: {
//                             path: '$category',
//                             preserveNullAndEmptyArrays: true,
//                         },
//                     },

//                     // subCategory
//                     {
//                         $lookup: {
//                             from: 'subcategories',
//                             localField: 'subCategory',
//                             foreignField: '_id',
//                             as: 'subCategory',
//                         },
//                     },
//                     {
//                         $unwind: {
//                             path: '$subCategory',
//                             preserveNullAndEmptyArrays: true,
//                         },
//                     },

//                     // creator
//                     {
//                         $lookup: {
//                             from: 'users',
//                             localField: 'creator',
//                             foreignField: '_id',
//                             as: 'creator',
//                         },
//                     },
//                     {
//                         $unwind: {
//                             path: '$creator',
//                             preserveNullAndEmptyArrays: true,
//                         },
//                     },

//                     // bookmark check
//                     {
//                         $lookup: {
//                             from: 'bookmarks',
//                             let: { podcastId: '$_id' },
//                             pipeline: [
//                                 {
//                                     $match: {
//                                         $expr: {
//                                             $and: [
//                                                 {
//                                                     $eq: [
//                                                         '$podcast',
//                                                         '$$podcastId',
//                                                     ],
//                                                 },
//                                                 { $eq: ['$user', userId] },
//                                             ],
//                                         },
//                                     },
//                                 },
//                             ],
//                             as: 'bookmarkDocs',
//                         },
//                     },
//                     {
//                         $addFields: {
//                             isBookmark: {
//                                 $gt: [{ $size: '$bookmarkDocs' }, 0],
//                             },
//                         },
//                     },
//                     { $project: { bookmarkDocs: 0 } },

//                     // like check
//                     {
//                         $addFields: {
//                             isLike: {
//                                 $in: [
//                                     new mongoose.Types.ObjectId(userId),
//                                     '$likers.user',
//                                 ],
//                             },
//                         },
//                     },

//                     // project only needed fields
//                     {
//                         $project: {
//                             title: 1,
//                             coverImage: 1,
//                             podcast_url: 1,
//                             location: 1,
//                             duration: 1,
//                             createdAt: 1,
//                             'category._id': 1,
//                             'category.name': 1,
//                             'subCategory._id': 1,
//                             'subCategory.name': 1,
//                             'creator._id': 1,
//                             'creator.name': 1,
//                             isBookmark: 1,
//                             isLike: 1,
//                         },
//                     },
//                 ],
//             },
//         },
//     ]);

//     const metadata = result[0]?.metadata?.[0] || {
//         page,
//         limit,
//         totalPages: 0,
//         totalPodcasts: 0,
//         hasMore: false,
//     };

//     return {
//         podcasts: result[0].podcasts,
//         ...metadata,
//     };
// };

const getSinglePodcast = async (id: string) => {
    const podcast = await Podcast.findById(id).populate([
        {
            path: 'creator',
            select: 'name profile_image',
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

const deletePodcastFromDB = async (userId: string, id: string) => {
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
            .sort({ createdAt: -1 })
            .limit(10),
        Podcast.find()
            .populate({ path: 'category', select: 'name' })
            .populate('subCategory', 'name')
            .populate('creator', 'name profile_image')

            .sort({ totalView: -1 })
            .limit(10),
        Podcast.find({ duration: { $lte: 120 } })
            .populate({ path: 'category', select: 'name' })
            .populate('subCategory', 'name')
            .populate('creator', 'name profile_image')
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
                    _id: 0,
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

// const getPodcastForSubcategories = async (categoryId: string) => {
//     const result = await SubCategory.aggregate([
//         {
//             $match: {
//                 category: new mongoose.Types.ObjectId(categoryId),
//                 isDeleted: false,
//             },
//         },
//         {
//             $lookup: {
//                 from: 'podcasts',
//                 let: { subCatId: '$_id', categoryId: '$category' },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     { $eq: ['$subCategory', '$$subCatId'] },
//                                     { $eq: ['$category', '$$categoryId'] },
//                                 ],
//                             },
//                         },
//                     },
//                     {
//                         $sort: { createdAt: -1 },
//                     },
//                     {
//                         $limit: 10,
//                     },
//                     {
//                         $project: {
//                             title: 1,
//                             coverImage: 1,
//                             video_url: 1,
//                             audio_url: 1,
//                             totalView: 1,
//                             duration: 1,
//                             createdAt: 1,
//                         },
//                     },
//                 ],
//                 as: 'podcasts',
//             },
//         },
//         {
//             $project: {
//                 _id: 1,
//                 name: 1,
//                 image: 1,
//                 podcasts: 1,
//             },
//         },
//     ]);

//     return result;
// };
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
