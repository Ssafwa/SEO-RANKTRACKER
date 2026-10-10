import test from 'node:test';
import assert from 'node:assert/strict';
import {
    browserbaseSessionOptions,
    extractGoogleResultUrl,
    isGoogleBlockPage,
    rankTracker,
} from '../services/rankTrackerService.js';
import {
    createRankCacheKey,
    getOrFetchRankResult,
    RANK_RESULT_CACHE_TTL_MS,
} from '../services/rankResultCache.js';

test('rank results are fetched from Browserbase only', async () => {
    const previousBrowserbaseKey = process.env.BROWSERBASE_API_KEY;
    const previousSerperKey = process.env.SERPER_API_KEY;
    const previousGoogleKey = process.env.GOOGLE_CSE_API_KEY;
    const previousGoogleCx = process.env.GOOGLE_CSE_CX;
    delete process.env.BROWSERBASE_API_KEY;
    process.env.SERPER_API_KEY = 'must-not-be-used';
    process.env.GOOGLE_CSE_API_KEY = 'must-not-be-used';
    process.env.GOOGLE_CSE_CX = 'must-not-be-used';

    try {
        const result = await rankTracker('sample keyword', 'example.com');
        assert.equal(result.success, false);
        assert.match(result.error, /BROWSERBASE_API_KEY is not configured/);
    } finally {
        if (previousBrowserbaseKey === undefined) delete process.env.BROWSERBASE_API_KEY;
        else process.env.BROWSERBASE_API_KEY = previousBrowserbaseKey;
        if (previousSerperKey === undefined) delete process.env.SERPER_API_KEY;
        else process.env.SERPER_API_KEY = previousSerperKey;
        if (previousGoogleKey === undefined) delete process.env.GOOGLE_CSE_API_KEY;
        else process.env.GOOGLE_CSE_API_KEY = previousGoogleKey;
        if (previousGoogleCx === undefined) delete process.env.GOOGLE_CSE_CX;
        else process.env.GOOGLE_CSE_CX = previousGoogleCx;
    }
});

test('rank cache uses normalized keyword and domain keys', () => {
    assert.equal(
        createRankCacheKey(' Example Keyword ', 'WWW.Example.com'),
        createRankCacheKey('example keyword', 'example.com'),
    );
    assert.notEqual(
        createRankCacheKey('example keyword', 'example.com'),
        createRankCacheKey('example keyword', 'other.example.com'),
    );
});

test('rank results are cached for 24 hours and reused until expiry', async () => {
    const entries = new Map();
    const cache = {
        async get(key, now) {
            const entry = entries.get(key);
            return entry && entry.expiresAt > now ? entry.data : null;
        },
        async set(key, data, expiresAt) {
            entries.set(key, { data, expiresAt });
        },
    };
    const now = new Date('2026-10-10T00:00:00.000Z');
    const data = { position: 4, totalResultScanned: 10 };
    let fetchCount = 0;
    const fetchResult = async () => {
        fetchCount += 1;
        return { success: true, data };
    };
    const first = await getOrFetchRankResult({ cache, cacheKey: 'keyword-domain', fetchResult, now });
    const cached = await getOrFetchRankResult({ cache, cacheKey: 'keyword-domain', fetchResult, now });

    assert.equal(first.cached, false);
    assert.equal(cached.cached, true);
    assert.equal(fetchCount, 1);
    assert.deepEqual(cached.data, data);
    assert.equal(entries.get('keyword-domain').expiresAt.getTime() - now.getTime(), RANK_RESULT_CACHE_TTL_MS);

    const afterExpiry = await getOrFetchRankResult({
        cache,
        cacheKey: 'keyword-domain',
        fetchResult,
        now: new Date(now.getTime() + RANK_RESULT_CACHE_TTL_MS + 1),
    });
    assert.equal(afterExpiry.cached, false);
    assert.equal(fetchCount, 2);
});

test('failed and blocked checks are not cached', async () => {
    const cache = {
        async get() { return null; },
        async set() { assert.fail('failed results must not be cached'); },
    };
    const result = await getOrFetchRankResult({
        cache,
        cacheKey: 'blocked-check',
        fetchResult: async () => ({ success: false, error: 'Google blocked this check, try again later' }),
    });

    assert.equal(result.success, false);
    assert.equal(result.cached, false);
});

test('Google block pages are recognized and have a clear user message', () => {
    assert.equal(isGoogleBlockPage('https://www.google.com/sorry/index'), true);
    assert.equal(isGoogleBlockPage('https://www.google.com/search?q=example', 'Our systems have detected unusual traffic'), true);
    assert.equal(isGoogleBlockPage('https://www.google.com/search?q=example', 'Sorry, your computer or network may be sending automated queries.'), true);
    assert.equal(isGoogleBlockPage('https://www.google.com/search?q=example', 'Normal search results'), false);
});

test('Google result links are extracted from direct links and redirect wrappers', () => {
    assert.equal(
        extractGoogleResultUrl('https://example.com/page'),
        'https://example.com/page',
    );
    assert.equal(
        extractGoogleResultUrl('https://www.google.com/url?q=https%3A%2F%2Fexample.com%2Fpage'),
        'https://example.com/page',
    );
    assert.equal(
        extractGoogleResultUrl('https://www.google.com/goto?url=opaque', 'https://example.com/page'),
        'https://example.com/page',
    );
    assert.equal(extractGoogleResultUrl('https://www.google.com/goto?url=opaque'), null);
    assert.equal(extractGoogleResultUrl('javascript:alert(1)'), null);
    assert.equal(
        extractGoogleResultUrl('https://www.google.com/url?q=https%3A%2F%2Fwww.google.com%2Fsearch'),
        null,
    );
});

test('Browserbase proxy is opt-in and only used when explicitly enabled', () => {
    assert.deepEqual(browserbaseSessionOptions(), { browserSettings: { blockAds: true } });
    assert.deepEqual(browserbaseSessionOptions({ useProxy: true }), {
        browserSettings: { blockAds: true },
        proxies: true,
    });
});
