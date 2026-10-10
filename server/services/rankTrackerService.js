import { chromium } from 'playwright-core';
import Browserbase from '@browserbasehq/sdk';
import RankSearchCache from '../models/RankSearchCache.js';
import { createRankCacheKey, getOrFetchRankResult } from './rankResultCache.js';

const RESULTS_PER_PAGE = 10;
const MAX_PAGES = 5;
const GOOGLE_BLOCK_MESSAGE = 'Google blocked this check, try again later';

function matchesDomain(resultDomain, targetDomain) {
    return resultDomain === targetDomain || resultDomain.endsWith(`.${targetDomain}`);
}

function normalizeDomain(domain) {
    return domain.toLowerCase().replace(/^www\./, '');
}

export function extractGoogleResultUrl(href, redirectLocation = '') {
    try {
        const url = new URL(href);
        const isGoogleHost = /(^|\.)google\.[a-z.]+$/i.test(url.hostname);
        let destination = href;

        if (isGoogleHost) {
            if (url.pathname === '/goto') {
                if (!redirectLocation) return null;
                destination = new URL(redirectLocation, url).href;
            } else if (url.pathname === '/url') {
                destination = url.searchParams.get('q') || url.searchParams.get('url') || '';
            } else {
                return null;
            }
        }

        const resolved = new URL(destination);
        if (!['http:', 'https:'].includes(resolved.protocol)) return null;
        if (/(^|\.)google\.[a-z.]+$/i.test(resolved.hostname)) return null;
        return resolved.href;
    } catch {
        return null;
    }
}

export function isGoogleBlockPage(url, bodyText = '') {
    return /google\.[^/]+\/sorry(?:\/|$)/i.test(url)
        || /unusual traffic|automated queries|automated requests|automated activity|our systems have detected|not a robot|captcha|sorry,? .*?computer|confirm you.?re not a robot|verify (?:that )?you(?:'|’)re (?:a human|not a robot)|before you continue to google/i.test(bodyText);
}

export function browserbaseSessionOptions({ useProxy = false } = {}) {
    return {
        browserSettings: { blockAds: true },
        ...(useProxy ? { proxies: true } : {}),
    };
}

async function isGoogleBlocked(page) {
    if (isGoogleBlockPage(page.url())) return true;
    try {
        const bodyText = await page.locator('body').innerText({ timeout: 2000 });
        return isGoogleBlockPage(page.url(), bodyText);
    } catch {
        return false;
    }
}

async function acceptGoogleConsent(page) {
    let consentPage = /consent\.google\./i.test(page.url());
    if (!consentPage) {
        try {
            const text = await page.locator('body').innerText({ timeout: 2000 });
            consentPage = /before you continue to google/i.test(text);
        } catch {
            return false;
        }
    }
    if (!consentPage) return false;

    try {
        let button = page.getByRole('button', { name: /accept all|agree/i }).first();
        if (!await button.isVisible({ timeout: 2000 })) {
            button = page.locator('button#L2AGLB, button[aria-label*="Accept"]').first();
        }
        if (!await button.isVisible({ timeout: 2000 })) return false;
        await button.click();
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
        return true;
    } catch {
        return false;
    }
}

async function resolveResultUrl(page, href) {
    const initialUrl = extractGoogleResultUrl(href);
    if (initialUrl) return initialUrl;

    let source;
    try {
        source = new URL(href);
    } catch {
        return null;
    }
    if (!/(^|\.)google\.[a-z.]+$/i.test(source.hostname) || source.pathname !== '/goto') return null;

    try {
        const response = await page.request.get(href, { maxRedirects: 0, timeout: 10000 });
        return extractGoogleResultUrl(href, response.headers().location || '');
    } catch (error) {
        console.error('Could not resolve a Google result redirect:', error.message);
        return null;
    }
}

async function searchWithBrowserbase(keyword, targetDomain) {
    const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
    if (!apiKey) {
        return { success: false, error: 'BROWSERBASE_API_KEY is not configured on the server.' };
    }

    const browserbase = new Browserbase({ apiKey });
    let browser;

    try {
        const session = await browserbase.sessions.create(browserbaseSessionOptions({
            useProxy: process.env.BROWSERBASE_USE_PROXY === 'true',
        }));
        browser = await chromium.connectOverCDP(session.connectUrl);
        const page = browser.contexts()[0]?.pages()[0];
        if (!page) throw new Error('Browser session did not provide a page');
        page.setDefaultNavigationTimeout(45000);

        await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
        try {
            const consentButton = page.locator('button#L2AGLB, button[aria-label*="Accept all"]').first();
            if (await consentButton.isVisible({ timeout: 2000 })) {
                await consentButton.click();
                await page.waitForTimeout(1000);
            }
        } catch {
            // Google may not show a consent prompt for this session.
        }

        const normalizedTarget = normalizeDomain(targetDomain);
        const allResults = [];
        let found = null;

        for (let pageNumber = 0; pageNumber < MAX_PAGES && !found; pageNumber += 1) {
            const response = await page.goto(
                `https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=${pageNumber * RESULTS_PER_PAGE}&num=${RESULTS_PER_PAGE}&hl=en&gl=us`,
                { waitUntil: 'domcontentloaded' },
            );

            if (response && [403, 429].includes(response.status())) {
                return { success: false, error: GOOGLE_BLOCK_MESSAGE, blocked: true };
            }

            if (await isGoogleBlocked(page)) {
                return { success: false, error: GOOGLE_BLOCK_MESSAGE, blocked: true };
            }

            if (await acceptGoogleConsent(page)) {
                await page.goto(
                    `https://www.google.com/search?q=${encodeURIComponent(keyword)}&start=${pageNumber * RESULTS_PER_PAGE}&num=${RESULTS_PER_PAGE}&hl=en&gl=us`,
                    { waitUntil: 'domcontentloaded' },
                );
            }

            const resultHeadings = page.locator('h3');
            try {
                await resultHeadings.first().waitFor({ state: 'visible', timeout: 10000 });
            } catch {
                if (await isGoogleBlocked(page)) {
                    return { success: false, error: GOOGLE_BLOCK_MESSAGE, blocked: true };
                }
                if (pageNumber > 0 && allResults.length > 0) break;

                if (pageNumber === 0) {
                    await page.reload({ waitUntil: 'domcontentloaded' });
                    try {
                        await resultHeadings.first().waitFor({ state: 'visible', timeout: 10000 });
                    } catch {
                        if (await isGoogleBlocked(page)) {
                            return { success: false, error: GOOGLE_BLOCK_MESSAGE, blocked: true };
                        }
                    }
                }

                if (await resultHeadings.count() === 0) {
                    const bodyText = await page.locator('body').innerText().catch(() => '');
                    console.error('Google search response had no result headings:', JSON.stringify({
                        url: new URL(page.url()).origin + new URL(page.url()).pathname,
                        title: await page.title().catch(() => ''),
                        status: response?.status() ?? null,
                        bodyLength: bodyText.length,
                        hasSearchResults: /search results|web results/i.test(bodyText),
                        hasConsentPrompt: /before you continue to google/i.test(bodyText),
                        hasBlockSignal: isGoogleBlockPage(page.url(), bodyText),
                    }));
                    throw new Error('Google search results could not be loaded');
                }
            }
            const rawResults = await resultHeadings.evaluateAll((headings) => headings.flatMap((heading) => {
                const anchor = heading.closest('a');
                if (!anchor || !anchor.href.startsWith('http')) return [];

                let container = heading.parentElement;
                let snippet = '';
                for (let depth = 0; depth < 6 && container; depth += 1, container = container.parentElement) {
                    const lines = (container.innerText || '').split('\n');
                    snippet = (lines.find((line) => line.length > heading.innerText.length + 20) || '').trim();
                    if (snippet) break;
                }

                return [{
                    href: anchor.href,
                    title: heading.innerText.trim(),
                    snippet: snippet.slice(0, 300),
                }];
            }));
            const results = (await Promise.all(rawResults.map(async (result) => {
                const url = await resolveResultUrl(page, result.href);
                if (!url) return null;
                const domain = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
                return { ...result, url, domain };
            }))).filter((result) => result !== null);

            if (rawResults.length > 0 && results.length === 0) {
                throw new Error('Google search results could not be resolved');
            }

            for (const result of results) {
                const entry = { ...result, position: allResults.length + 1 };
                allResults.push(entry);
                if (matchesDomain(result.domain, normalizedTarget)) {
                    found = { ...entry, page: pageNumber + 1 };
                    break;
                }
            }

            if (results.length === 0 && allResults.length === 0) {
                throw new Error('Google search results could not be loaded');
            }
            if (!found && pageNumber < MAX_PAGES - 1) await page.waitForTimeout(1000);
        }

        return {
            success: true,
            data: {
                keyword,
                targetDomain,
                position: found?.position ?? null,
                page: found?.page ?? null,
                title: found?.title ?? '',
                snippet: found?.snippet ?? '',
                competitors: allResults
                    .filter((result) => !matchesDomain(result.domain, normalizedTarget))
                    .slice(0, 10),
                totalResultScanned: allResults.length,
            },
        };
    } catch (error) {
        console.error('Browserbase rank check failed:', error.message);
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close().catch((error) => console.error('Browser close error:', error.message));
    }
}

const rankResultCache = {
    async get(cacheKey, now) {
        const entry = await RankSearchCache.findOne({ cacheKey, expiresAt: { $gt: now } }).lean();
        return entry?.result ?? null;
    },
    async set(cacheKey, result, expiresAt) {
        await RankSearchCache.updateOne(
            { cacheKey },
            { $set: { result, expiresAt } },
            { upsert: true, runValidators: true },
        );
    },
};

export async function rankTracker(keyword, targetDomain) {
    if (!process.env.BROWSERBASE_API_KEY?.trim()) {
        return { success: false, error: 'BROWSERBASE_API_KEY is not configured on the server.' };
    }

    const normalizedTarget = normalizeDomain(targetDomain);
    const cacheKey = createRankCacheKey(keyword, normalizedTarget);
    return getOrFetchRankResult({
        cache: rankResultCache,
        cacheKey,
        fetchResult: () => searchWithBrowserbase(keyword, normalizedTarget),
    });
}
