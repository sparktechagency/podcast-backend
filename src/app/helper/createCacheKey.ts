import crypto from 'crypto';

export const createCacheKey = (query: Record<string, unknown>): string => {
    // 1. Sort query keys so serialization is consistent
    const sortedQuery = Object.keys(query)
        .sort()
        .reduce(
            (obj, key) => {
                obj[key] = query[key];
                return obj;
            },
            {} as Record<string, unknown>
        );

    // 2. Serialize the sorted query object
    const queryString = JSON.stringify(sortedQuery);

    // 3. Hash the query string to keep key length reasonable
    const hash = crypto.createHash('sha256').update(queryString).digest('hex');

    // 4. Return the final key with a prefix
    return `podcasts:query:${hash}`;
};
