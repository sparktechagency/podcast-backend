import httpStatus from 'http-status';
import AppError from '../../error/appError';
import Podcast from '../podcast/podcast.model';
import Bookmark from './bookmark.model';
import QueryBuilder from '../../builder/QueryBuilder';

const bookmarkAddDelete = async (profileId: string, podcastId: string) => {
    const podcast = await Podcast.findById(podcastId);
    if (!podcast) {
        throw new AppError(httpStatus.NOT_FOUND, 'Podcast not found');
    }
    const bookmark = await Bookmark.findOne({
        user: profileId,
        podcast: podcastId,
    });
    if (bookmark) {
        await Bookmark.findOneAndDelete({
            user: profileId,
            podcast: podcastId,
        });
        return null;
    } else {
        const result = await Bookmark.create({
            user: profileId,
            podcast: podcastId,
        });
        return result;
    }
};

// get bookmark from db
const getMyBookmarkFromDB = async (
    profileId: string,
    query: Record<string, unknown>
) => {
    const resultQuery = new QueryBuilder(
        Bookmark.find({ user: profileId }).populate({
            path: 'podcast',
            select: 'title duration creator subCategory category totalView createdAt',
            populate: [
                {
                    path: 'category',
                    select: 'name',
                },
                {
                    path: 'subCategory',
                    select: 'name',
                },
                {
                    path: 'creator',
                    select: 'name profile_image',
                },
            ],
        }),
        query
    )
        .search(['name', 'email'])
        .fields()
        .filter()
        .paginate()
        .sort();
    const result = await resultQuery.modelQuery;
    const meta = await resultQuery.countTotal();
    return { meta, result };
};

const BookmarkService = {
    bookmarkAddDelete,
    getMyBookmarkFromDB,
};

export default BookmarkService;
