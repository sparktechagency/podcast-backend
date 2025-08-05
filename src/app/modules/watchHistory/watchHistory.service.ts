import QueryBuilder from '../../builder/QueryBuilder';
import WatchHistory from './watchHistory.model';
import cron from 'node-cron';
const getWatchedHistory = async (
    profileId: string,
    query: Record<string, unknown>
) => {
    const resultQuery = new QueryBuilder(
        WatchHistory.find({ user: profileId }).populate({
            path: 'podcast',
            select: 'title name coverImage description duration audio_url video_url creator subCategory category address location tags totalView createdAt',
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

// Runs every Sunday at 2:00 AM
cron.schedule('0 2 * * 0', async () => {
    try {
        console.log('⏳ Cleaning up old watch history...');

        const uniqueUsers = await WatchHistory.distinct('user');

        for (const userId of uniqueUsers) {
            const latestEntries = await WatchHistory.find({ user: userId })
                .sort({ createdAt: -1 })
                .limit(50)
                .select('_id');

            const latestIds = latestEntries.map((entry) => entry._id);

            await WatchHistory.deleteMany({
                user: userId,
                _id: { $nin: latestIds },
            });

            console.log(` Cleaned history for user ${userId}`);
        }

        console.log(' Watch history cleanup completed.');
    } catch (error) {
        console.error('Error cleaning watch history:', error);
    }
});

const WatchHistoryServices = { getWatchedHistory };
export default WatchHistoryServices;
