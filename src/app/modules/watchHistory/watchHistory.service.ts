import QueryBuilder from '../../builder/QueryBuilder';
import WatchHistory from './watchHistory.model';

const getWatchedHistory = async (
    profileId: string,
    query: Record<string, unknown>
) => {
    const resultQuery = new QueryBuilder(
        WatchHistory.find({ user: profileId }),
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

const WatchHistoryServices = { getWatchedHistory };
export default WatchHistoryServices;
