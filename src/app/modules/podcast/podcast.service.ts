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
import mongoose from 'mongoose';
import Bookmark from '../bookmark/bookmark.model';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLE } from '../user/user.constant';
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
    if (payload.podcast_url) {
        payload.podcast_url = getCloudFrontUrl(payload.podcast_url);
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

const getAllPodcasts = async (query: Record<string, unknown>) => {
    const cacheKey = createCacheKey(query);

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
        Podcast.find({ ...filterQuery }).populate([
            { path: 'creator', select: 'name profile_image donationLink' },
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

// cursor based pagination =================
// const getPodcastFeedForUser = async (
//     userId: string,
//     query: Record<string, unknown>
// ) => {
//     const cursor: string = query.cursor as string;
//     const lng = query.lng;
//     const lat = query.lat;
//     const limit = 2;
//     const cursorDate = cursor ? new Date(cursor) : new Date();
//     const cacheKey = `feed:${userId}:${lat}:${lng}:${cursor || 'first'}`;

//     // Step 1: Return from Redis cache if available
//     // const cached = await redis.get(cacheKey);
//     // if (cached) return JSON.parse(cached);

//     // Step 2: Get top liked categories/subcategories
//     const likedPods = await Podcast.find({ liker: userId })
//         .select('category subCategory')
//         .limit(100)
//         .lean();

//     const topCategories = [
//         ...new Set(likedPods.map((p) => p.category?.toString())),
//     ];
//     const topSubCategories = [
//         ...new Set(likedPods.map((p) => p.subCategory?.toString())),
//     ];

//     // Step 3: Get already watched podcast IDs
//     const watched = await WatchHistory.find({ user: userId })
//         .select('podcast')
//         .lean();
//     const watchedIds = watched.map((w) => w.podcast.toString());

//     // Step 4: Build dynamic query
//     const queryData: any = {
//         createdAt: { $lt: cursorDate },
//         _id: { $nin: watchedIds },
//         location: {
//             $nearSphere: {
//                 $geometry: { type: 'Point', coordinates: [lng, lat] },
//                 $maxDistance: 100 * 1000, // 100 km
//             },
//         },
//         $or: [],
//     };

//     if (topCategories.length) {
//         queryData.$or.push({ category: { $in: topCategories } });
//     }

//     if (topSubCategories.length) {
//         queryData.$or.push({ subCategory: { $in: topSubCategories } });
//     }

//     // Fallback: trending feed if no personalization
//     const isPersonalized = queryData.$or.length > 0;

//     const podcasts: any = await Podcast.find(
//         isPersonalized
//             ? query
//             : {
//                   createdAt: { $lt: cursorDate },
//                   _id: { $nin: watchedIds },
//               }
//     )
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .select(
//             'title coverImage video_url audio_url category subCategory location duration createdAt'
//         )
//         .populate('category subCategory creator', 'name profileImage')
//         .lean();

//     // Step 5: Prepare cursor for pagination
//     const nextCursor =
//         podcasts.length === limit
//             ? podcasts[podcasts.length - 1].createdAt.toISOString()
//             : null;

//     const result = {
//         data: podcasts,
//         nextCursor,
//         hasMore: Boolean(nextCursor),
//     };

//     // Step 6: Cache result for 5 minutes
//     await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);

//     return result;
// };

// const getPodcastFeedForUser = async (
//     userId: string,
//     query: Record<string, unknown>
// ) => {
//     const cursor: string = query.cursor as string;
//     const lng = (query.lng as number) || undefined;
//     const lat = (query.lat as number) || undefined;
//     const categoryId = query.category as string | undefined;
//     const subCategoryId = query.subCategory as string | undefined;
//     const searchTerm = query.searchTerm as string | undefined;
//     const limit = 20;
//     const cursorDate = cursor ? new Date(cursor) : new Date();
//     const cacheKey = `feed:${userId}:${lat}:${lng}:${categoryId || 'any'}:${
//         subCategoryId || 'any'
//     }:${searchTerm || 'none'}:${cursor || 'first'}`;

//     // Step 1: Try Redis cache
//     const cached = await redis.get(cacheKey);
//     if (cached) return JSON.parse(cached);

//     // Step 2: Get top liked categories/subcategories
//     const likedPods = await Podcast.find({ liker: userId })
//         .select('category subCategory')
//         .limit(100)
//         .lean();

//     const topCategories = [
//         ...new Set(likedPods.map((p) => p.category?.toString())),
//     ];
//     const topSubCategories = [
//         ...new Set(likedPods.map((p) => p.subCategory?.toString())),
//     ];

//     // Step 3: Get watched podcast IDs
//     const watched = await WatchHistory.find({ user: userId })
//         .select('podcast')
//         .lean();
//     const watchedIds = watched.map((w) => w.podcast.toString());

//     // Step 4: Build query
//     const queryData: any = {
//         createdAt: { $lt: cursorDate },
//         _id: { $nin: watchedIds },
//         // location: {
//         //     $nearSphere: {
//         //         $geometry: { type: 'Point', coordinates: [lng, lat] },
//         //         $maxDistance: 100 * 1000, // 100 km radius
//         //     },
//         // },
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

//     // Filters
//     if (categoryId) {
//         queryData.$and.push({ category: categoryId });
//     }
//     if (subCategoryId) {
//         queryData.$and.push({ subCategory: subCategoryId });
//     }
//     if (searchTerm) {
//         queryData.$and.push({ title: { $regex: new RegExp(searchTerm, 'i') } });
//     }
//     if (query.reels) {
//         queryData.$and.push({ duration: { $lte: 120 } });
//     }

//     // Personalization only if no filters/search applied
//     if (!categoryId && !subCategoryId && !searchTerm) {
//         const ors = [];
//         if (topCategories.length)
//             ors.push({ category: { $in: topCategories } });
//         if (topSubCategories.length)
//             ors.push({ subCategory: { $in: topSubCategories } });
//         if (ors.length) queryData.$and.push({ $or: ors });
//     }

//     // If no filters or personalization added to $and, remove it to avoid empty $and
//     if (queryData.$and.length === 0) {
//         delete queryData.$and;
//     }

//     // sort
//     const sortField = query.popular ? 'totalView' : 'createdAt';

//     // Step 5: Query MongoDB
//     const podcasts: any = await Podcast.find(queryData)
//         .sort({ [sortField]: -1 })
//         .limit(limit)
//         .select(
//             'title coverImage video_url audio_url category subCategory location duration createdAt'
//         )
//         .populate('category subCategory creator', 'name profileImage')
//         .lean();

//     if (query.firstPodcastId) {
//         const firstPodcast = await Podcast.findById(query.firstPodcastId)
//             .select(
//                 'title coverImage video_url audio_url category subCategory location duration createdAt'
//             )
//             .populate('category subCategory creator', 'name profileImage');
//         if (firstPodcast) {
//             podcasts.unshift(firstPodcast);
//         }
//     }

//     // Step 6: Pagination cursor
//     const nextCursor =
//         podcasts.length === limit
//             ? podcasts[podcasts.length - 1].createdAt.toISOString()
//             : null;

//     const result = {
//         podcasts,
//         nextCursor,
//         hasMore: Boolean(nextCursor),
//     };

//     // Step 7: Cache the result
//     await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);

//     return result;
// };
// const getPodcastFeedForUser = async (
//     userId: string,
//     query: Record<string, unknown>
// ) => {
//     const cursor: string = query.cursor as string;
//     const lng = (query.lng as number) || undefined;
//     const lat = (query.lat as number) || undefined;
//     const categoryId = query.category as string | undefined;
//     const subCategoryId = query.subCategory as string | undefined;
//     const searchTerm = query.searchTerm as string | undefined;
//     const limit = 20;
//     const cursorDate = cursor ? new Date(cursor) : new Date();
//     const cacheKey = `feed:${userId}:${lat}:${lng}:${categoryId || 'any'}:${
//         subCategoryId || 'any'
//     }:${searchTerm || 'none'}:${cursor || 'first'}`;

//     // Step 1: Try Redis cache
//     const cached = await redis.get(cacheKey);
//     if (cached) return JSON.parse(cached);

//     // Step 2: Get top liked categories/subcategories
//     const likedPods = await Podcast.find({ liker: userId })
//         .select('category subCategory')
//         .limit(100)
//         .lean();

//     const topCategories = [
//         ...new Set(likedPods.map((p) => p.category?.toString())),
//     ];
//     const topSubCategories = [
//         ...new Set(likedPods.map((p) => p.subCategory?.toString())),
//     ];

//     // Step 3: Get bookmarks and watched podcasts in parallel
//     const [bookmarks, watched] = await Promise.all([
//         Bookmark.find({ user: userId }).select('podcast').lean(),
//         WatchHistory.find({ user: userId }).select('podcast').lean(),
//     ]);

//     const bookmarkedPodcastIds = bookmarks.map((b) => b.podcast.toString());
//     const watchedIds = watched.map((w) => w.podcast.toString());

//     // Step 4: Build query
//     const queryData: any = {
//         createdAt: { $lt: cursorDate },
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

//     // Filters
//     if (categoryId) {
//         queryData.$and.push({ category: categoryId });
//     }
//     if (subCategoryId) {
//         queryData.$and.push({ subCategory: subCategoryId });
//     }
//     if (searchTerm) {
//         queryData.$and.push({ title: { $regex: new RegExp(searchTerm, 'i') } });
//     }
//     if (query.reels) {
//         queryData.$and.push({ duration: { $lte: 120 } });
//     }

//     // Personalization only if no filters/search applied
//     if (!categoryId && !subCategoryId && !searchTerm) {
//         const ors = [];
//         if (topCategories.length)
//             ors.push({ category: { $in: topCategories } });
//         if (topSubCategories.length)
//             ors.push({ subCategory: { $in: topSubCategories } });
//         if (ors.length) queryData.$and.push({ $or: ors });
//     }

//     // If no filters or personalization added to $and, remove it to avoid empty $and
//     if (queryData.$and.length === 0) {
//         delete queryData.$and;
//     }

//     // Sort
//     const sortField = query.popular ? 'totalView' : 'createdAt';

//     // Step 5: Query MongoDB
//     const podcasts: any = await Podcast.find(queryData)
//         .sort({ [sortField]: -1 })
//         .limit(limit)
//         .select(
//             'title coverImage video_url audio_url category subCategory location duration createdAt'
//         )
//         .populate('category subCategory creator', 'name profileImage')
//         .lean();

//     if (query.firstPodcastId) {
//         const firstPodcast = await Podcast.findById(query.firstPodcastId)
//             .select(
//                 'title coverImage video_url audio_url category subCategory location duration createdAt'
//             )
//             .populate('category subCategory creator', 'name profileImage')
//             .lean();
//         if (firstPodcast) {
//             const isBookmarked = bookmarkedPodcastIds.includes(
//                 firstPodcast._id.toString()
//             );
//             podcasts.unshift({ ...firstPodcast, isBookmark: isBookmarked });
//         }
//     }

//     // Step 6: Add bookmark flag to podcasts
//     const podcastsWithBookmarkFlag = podcasts.map((podcast: any) => ({
//         ...podcast,
//         isBookmark: bookmarkedPodcastIds.includes(podcast._id.toString()),
//     }));

//     // Step 7: Pagination cursor
//     const nextCursor =
//         podcastsWithBookmarkFlag.length === limit
//             ? podcastsWithBookmarkFlag[
//                   podcastsWithBookmarkFlag.length - 1
//               ].createdAt.toISOString()
//             : null;

//     const result = {
//         podcasts: podcastsWithBookmarkFlag,
//         nextCursor,
//         hasMore: Boolean(nextCursor),
//     };

//     // Step 8: Cache the result
//     await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);

//     return result;
// };

// const getPodcastFeedForUser = async (
//     userId: string,
//     query: Record<string, unknown>
// ) => {
//     const cursor: string = query.cursor as string;
//     const lng = (query.lng as number) || undefined;
//     const lat = (query.lat as number) || undefined;
//     const categoryId = query.category as string | undefined;
//     const subCategoryId = query.subCategory as string | undefined;
//     const searchTerm = query.searchTerm as string | undefined;
//     const limit = 20;
//     const cursorDate = cursor ? new Date(cursor) : new Date();

//     // Step 2: Get top liked categories/subcategories
//     let likedPods: any[] = [];
//     const cacheKeyForLikePods = `likedPods:${userId}`;
//     const cachedLikedPods = await redis.get(cacheKeyForLikePods);
//     if (cachedLikedPods) {
//         likedPods = JSON.parse(cachedLikedPods);
//     } else {
//         likedPods = await Podcast.find({ liker: userId })
//             .select('category subCategory')
//             .limit(50)
//             .lean();
//         await redis.set(
//             cacheKeyForLikePods,
//             JSON.stringify(likedPods),
//             'EX',
//             300
//         );
//     }

//     const topCategories = [
//         ...new Set(likedPods.map((p) => p.category?.toString())),
//     ];
//     const topSubCategories = [
//         ...new Set(likedPods.map((p) => p.subCategory?.toString())),
//     ];

//     // Step 3: Get bookmarks and watched podcasts in parallel
//     const cacheKeyForBookmarksAndWatched = `bookmarksAndWatched:${userId}`;
//     let bookmarks: any[] = [];
//     let watched: any[] = [];
//     const cachedBookmarksAndWatched: string | null = await redis.get(
//         cacheKeyForBookmarksAndWatched
//     );
//     if (cachedBookmarksAndWatched) {
//         const parsed = JSON.parse(cachedBookmarksAndWatched);
//         bookmarks = parsed.bookmarks;
//         watched = parsed.watched;
//     } else {
//         [bookmarks, watched] = await Promise.all([
//             Bookmark.find({ user: userId }).select('podcast').lean(),
//             WatchHistory.find({ user: userId }).select('podcast').lean(),
//         ]);
//         await redis.set(
//             cacheKeyForBookmarksAndWatched,
//             JSON.stringify({ bookmarks, watched }),
//             'EX',
//             300
//         );
//     }

//     const bookmarkedPodcastIds = new Set(
//         bookmarks.map((b) => b.podcast.toString())
//     );
//     const watchedIds = watched.map((w) => w.podcast.toString());

//     // Step 4: Build query
//     const queryData: any = {
//         createdAt: { $lt: cursorDate },
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

//     // Filters
//     if (categoryId) queryData.$and.push({ category: categoryId });
//     if (subCategoryId) queryData.$and.push({ subCategory: subCategoryId });
//     if (searchTerm)
//         queryData.$and.push({ title: { $regex: new RegExp(searchTerm, 'i') } });
//     if (query.reels) queryData.$and.push({ duration: { $lte: 120 } });

//     // Personalization only if no filters/search applied
//     if (!categoryId && !subCategoryId && !searchTerm) {
//         const ors = [];
//         if (topCategories.length)
//             ors.push({ category: { $in: topCategories } });
//         if (topSubCategories.length)
//             ors.push({ subCategory: { $in: topSubCategories } });
//         if (ors.length) queryData.$and.push({ $or: ors });
//     }

//     // Remove empty $and if unused
//     if (queryData.$and.length === 0) delete queryData.$and;

//     // Sort by popular or recent
//     const sortField = query.popular ? 'totalView' : 'createdAt';

//     // Step 5: Query Podcasts with minimal fields & minimal populate
//     const podcasts: any = await Podcast.find(queryData)
//         .sort({ [sortField]: -1 })
//         .limit(limit)
//         .select(
//             'title coverImage video_url audio_url category subCategory location duration createdAt creator'
//         )
//         .populate('category', 'name') // only name & _id
//         .populate('subCategory', 'name') // only name & _id
//         .populate('creator', 'name') // only name & _id
//         .lean();

//     // Optional firstPodcastId logic
//     if (query.firstPodcastId) {
//         const firstPodcast = await Podcast.findById(query.firstPodcastId)
//             .select(
//                 'title coverImage video_url audio_url category subCategory location duration createdAt creator'
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

//     // Step 6: Add bookmark flag to podcasts
//     const podcastsWithBookmarkFlag = podcasts.map((podcast: any) => ({
//         ...podcast,
//         isBookmark: bookmarkedPodcastIds.has(podcast._id.toString()),
//     }));

//     // Step 7: Pagination cursor
//     const nextCursor =
//         podcastsWithBookmarkFlag.length === limit
//             ? podcastsWithBookmarkFlag[
//                   podcastsWithBookmarkFlag.length - 1
//               ].createdAt.toISOString()
//             : null;

//     const response = {
//         podcasts: podcastsWithBookmarkFlag,
//         nextCursor,
//         hasMore: Boolean(nextCursor),
//     };

//     return response;
// };

// const createCacheKeyForFeed = (
//     userId: string,
//     lat?: number,
//     lng?: number,
//     query?: Record<string, unknown>
// ): string => {
//     // You need to handle undefined query inside the function
//     const sortedQuery = Object.keys(query ?? {})
//         .sort()
//         .reduce(
//             (obj, key) => {
//                 obj[key] = query![key];
//                 return obj;
//             },
//             {} as Record<string, unknown>
//         );

//     const queryString = JSON.stringify(sortedQuery);
//     const hash = crypto.createHash('sha256').update(queryString).digest('hex');

//     return `feed:${userId}:${lat ?? 'any'}:${lng ?? 'any'}:${hash}`;
// };

const getPodcastFeedForUser = async (
    userId: string,
    query: Record<string, unknown>
) => {
    const cursor: string = query.cursor as string;
    const lng = (query.lng as number) || undefined;
    const lat = (query.lat as number) || undefined;
    const categoryId = query.category as string | undefined;
    const subCategoryId = query.subCategory as string | undefined;
    const searchTerm = query.searchTerm as string | undefined;
    const limit = 20;
    const cursorDate = cursor ? new Date(cursor) : new Date();

    // // Create a cache key for final results based on userId, lat, lng and query params
    // const cacheKey = createCacheKeyForFeed(userId, lat, lng, query);

    // // Step 1: Try to get final result from cache (this reduces DB hits dramatically)
    // const cachedResult = await redis.get(cacheKey);
    // if (cachedResult) {
    //     return JSON.parse(cachedResult);
    // }

    // Step 2: Parallel Redis get for liked pods & bookmarks+watched caches
    const [cachedLikedPods, cachedBookmarksAndWatched] = await Promise.all([
        redis.get(`likedPods:${userId}`),
        redis.get(`bookmarksAndWatched:${userId}`),
    ]);

    let likedPods: any[] = [];
    if (cachedLikedPods) {
        likedPods = JSON.parse(cachedLikedPods);
    } else {
        likedPods = await Podcast.find({ liker: userId })
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

    // Step 3: Prepare top categories & subCategories for personalization
    const topCategories = [
        ...new Set(likedPods.map((p) => p.category?.toString())),
    ];
    const topSubCategories = [
        ...new Set(likedPods.map((p) => p.subCategory?.toString())),
    ];

    // Step 4: Build main Mongo query object with filters & personalization
    const queryData: any = {
        createdAt: { $lt: cursorDate },
        _id: { $nin: watchedIds },
        $and: [],
    };

    if (
        typeof lat === 'number' &&
        !isNaN(lat) &&
        typeof lng === 'number' &&
        !isNaN(lng)
    ) {
        queryData.location = {
            $nearSphere: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: 100 * 1000, // 100 km radius
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

    // Step 5: Query podcasts with minimal fields and minimal population
    const podcasts: any = await Podcast.find(queryData)
        .sort({ [sortField]: -1 })
        .limit(limit)
        .select(
            'title coverImage podcast_url category subCategory location duration createdAt creator'
        )
        .populate('category', 'name') // only name & _id
        .populate('subCategory', 'name') // only name & _id
        .populate('creator', 'name') // only name & _id
        .lean();

    // Step 6: Optional firstPodcastId logic: fetch separately and add on top
    if (query.firstPodcastId) {
        const firstPodcast = await Podcast.findById(query.firstPodcastId)
            .select(
                'title coverImage podcast_url category subCategory location duration createdAt creator'
            )
            .populate('category', 'name')
            .populate('subCategory', 'name')
            .populate('creator', 'name')
            .lean();
        if (firstPodcast) {
            const isBookmarked = bookmarkedPodcastIds.has(
                firstPodcast._id.toString()
            );
            podcasts.unshift({ ...firstPodcast, isBookmark: isBookmarked });
        }
    }

    // Step 7: Add bookmark flag to each podcast
    const podcastsWithBookmarkFlag = podcasts.map((podcast: any) => ({
        ...podcast,
        isBookmark: bookmarkedPodcastIds.has(podcast._id.toString()),
    }));

    // Step 8: Pagination cursor for next page
    const nextCursor =
        podcastsWithBookmarkFlag.length === limit
            ? podcastsWithBookmarkFlag[
                  podcastsWithBookmarkFlag.length - 1
              ].createdAt.toISOString()
            : null;

    const response = {
        podcasts: podcastsWithBookmarkFlag,
        nextCursor,
        hasMore: Boolean(nextCursor),
    };

    // Step 9: Cache final response for 3 minutes
    // await redis.set(cacheKey, JSON.stringify(response), 'EX', 180);

    return response;
};

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
                    donationLink: '$creatorInfo.donationLink',
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
        return { message: 'Unliked successfully' };
    } else {
        await Podcast.findByIdAndUpdate(podcastId, {
            $push: { likers: { user: userObjectId, userType } },
        });
        return { message: 'Liked successfully' };
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
