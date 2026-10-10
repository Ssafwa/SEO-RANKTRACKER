import { createHash } from 'node:crypto';

export const RANK_RESULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function createRankCacheKey(keyword, targetDomain) {
    const query = JSON.stringify({
        keyword: keyword.trim().toLocaleLowerCase('en-US'),
        domain: targetDomain.trim().toLowerCase().replace(/^www\./, ''),
        location: 'us',
        language: 'en',
    });
    return createHash('sha256').update(query).digest('hex');
}

export async function getOrFetchRankResult({ cache, cacheKey, fetchResult, now = new Date() }) {
    try {
        const cachedData = await cache.get(cacheKey, now);
        if (cachedData) {
            return { success: true, data: cachedData, cached: true };
        }
    } catch (error) {
        console.error('Could not read rank-result cache:', error.message);
    }

    const result = await fetchResult();
    if (result.success) {
        try {
            await cache.set(cacheKey, result.data, new Date(now.getTime() + RANK_RESULT_CACHE_TTL_MS));
        } catch (error) {
            console.error('Could not save rank result to cache:', error.message);
        }
    }
    return { ...result, cached: false };
}
