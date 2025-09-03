export const generateCacheKey = (
    base: string,
    query: Record<string, unknown> = {}
): string => {
    if (!query || Object.keys(query).length === 0) {
        return `${base}:default`;
    }

    const queryString = Object.entries(query)
        .sort(([a], [b]) => a.localeCompare(b)) // sort keys for consistency
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    return `${base}:${queryString}`;
};
