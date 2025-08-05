import httpStatus from 'http-status';
import AppError from '../../error/appError';
import Podcast from '../podcast/podcast.model';
import Bookmark from './bookmark.model';

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
const getMyBookmarkFromDB = async (profileId: string) => {
    const result = await Bookmark.find({ user: profileId });
    return result;
};

const productBookmarkServices = {
    bookmarkAddDelete,
    getMyBookmarkFromDB,
};

export default productBookmarkServices;
