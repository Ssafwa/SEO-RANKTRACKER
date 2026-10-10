import mongoose from 'mongoose';
import KeywordTracking from '../models/keywordTracking.js';
import { rankTracker } from '../services/rankTrackerService.js';
import { isValidCronAuthorization } from '../middleware/cronAuth.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const STALE_CHECK_IN_MS = 2 * 60 * 1000;
const DAILY_CHECK_DELAY_MS = 3000;

const notFound = (res) => res.status(404).json({ success: false, message: 'Tracking not found' });

async function recoverStaleRankCheck(tracking) {
    if (tracking.status !== 'checking') return tracking;

    const staleBefore = new Date(Date.now() - STALE_CHECK_IN_MS);
    const startedAt = tracking.checkStartedAt;
    if (startedAt && startedAt > staleBefore) return tracking;

    await KeywordTracking.updateOne(
        {
            _id: tracking._id,
            userId: tracking.userId,
            status: 'checking',
            ...(startedAt ? { checkStartedAt: startedAt } : { $or: [{ checkStartedAt: null }, { checkStartedAt: { $exists: false } }] }),
        },
        {
            $set: {
                status: 'failed',
                lastError: 'This rank check did not finish. Use Refresh Now to retry.',
                checkStartedAt: null,
            },
        },
    );
    return KeywordTracking.findOne({ _id: tracking._id, userId: tracking.userId });
}

async function recoverStaleRankChecksForUser(userId) {
    const staleBefore = new Date(Date.now() - STALE_CHECK_IN_MS);
    await KeywordTracking.updateMany(
        {
            userId,
            status: 'checking',
            $or: [
                { checkStartedAt: null },
                { checkStartedAt: { $exists: false } },
                { checkStartedAt: { $lte: staleBefore } },
            ],
        },
        {
            $set: {
                status: 'failed',
                lastError: 'This rank check did not finish. Use Refresh Now to retry.',
                checkStartedAt: null,
            },
        },
    );
}

export function rankCheckErrorMessage(error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('BROWSERBASE_API_KEY is not configured')) {
        return 'Rank tracking is not configured on the server. Set BROWSERBASE_API_KEY and restart the API.';
    }
    if (message.includes('Google blocked this check')) {
        return 'Google blocked this check, try again later';
    }
    if (/401|unauthorized|invalid api.?key|authentication failed/i.test(message)) {
        return 'Browserbase authentication failed. Check BROWSERBASE_API_KEY in the server environment.';
    }
    if (/402|billing|payment required|quota exceeded|insufficient credits/i.test(message)) {
        return 'Browserbase account limit reached. Check your Browserbase plan and usage.';
    }
    if (/429|rate.?limit|too many requests/i.test(message)) {
        return 'Browserbase rate limited this check. Wait a little, then try again.';
    }
    if (/timeout|timed out|maximum duration|function.*terminated/i.test(message)) {
        return 'The rank check timed out before it finished. Use Refresh Now to retry.';
    }
    if (/session limit|maximum.*sessions|concurrent sessions/i.test(message)) {
        return 'Browserbase has reached its active-session limit. Wait for a session to finish, then retry.';
    }
    if (/Google search results could not be loaded/i.test(message)) {
        return 'Google search results could not be loaded. Try again later.';
    }
    if (/Google search results could not be resolved/i.test(message)) {
        return 'Google search result links could not be resolved. Try again later.';
    }
    return 'The rank check could not finish in Browserbase. Use Refresh Now to retry; if it keeps failing, check the server logs.';
}

function serializeTracking(tracking) {
    const data = tracking.toObject ? tracking.toObject() : tracking;
    return { ...data, lastCheck: data.status };
}

export const addKeyword = async (req, res) => {
    const body = req.body || {};
    const keyword = typeof body.keyword === 'string' ? body.keyword.trim() : '';
    const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';

    if (!keyword || !rawUrl) {
        return res.status(400).json({ success: false, message: 'Keyword and website URL are required' });
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
    } catch {
        return res.status(400).json({ success: false, message: 'Enter a valid website URL' });
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.hostname.includes('.')) {
        return res.status(400).json({ success: false, message: 'Enter a valid website URL' });
    }

    try {
        const tracking = await KeywordTracking.create({
            userId: req.userId,
            keyword,
            url: parsedUrl.href,
            domain: parsedUrl.hostname.toLowerCase().replace(/^www\./, ''),
            status: 'checking',
            checkStartedAt: new Date(),
        });
        await runRankCheck(tracking);
        const completedTracking = await KeywordTracking.findOne({ _id: tracking._id, userId: req.userId });
        return res.status(201).json({ success: true, tracking: serializeTracking(completedTracking || tracking) });
    } catch (error) {
        console.error('Add keyword error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to create keyword tracking' });
    }
};

export const getAllKeywords = async (req, res) => {
    try {
        await recoverStaleRankChecksForUser(req.userId);
        const keywords = await KeywordTracking.find({ userId: req.userId }).sort({ createdAt: -1 });
        return res.json({ success: true, keywords: keywords.map(serializeTracking) });
    } catch (error) {
        console.error('List keywords error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to load keyword tracking' });
    }
};

export const getKeyword = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
    try {
        let tracking = await KeywordTracking.findOne({ _id: req.params.id, userId: req.userId });
        if (!tracking) return notFound(res);
        tracking = await recoverStaleRankCheck(tracking);
        if (!tracking) return notFound(res);
        return res.json({ success: true, tracking: serializeTracking(tracking) });
    } catch (error) {
        console.error('Get keyword error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to load keyword tracking' });
    }
};

export const deleteKeyword = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
    try {
        const tracking = await KeywordTracking.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!tracking) return notFound(res);
        return res.json({ success: true });
    } catch (error) {
        console.error('Delete keyword error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete keyword tracking' });
    }
};

export const toggleKeyword = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
    try {
        const tracking = await KeywordTracking.findOne({ _id: req.params.id, userId: req.userId });
        if (!tracking) return notFound(res);
        tracking.active = !tracking.active;
        await tracking.save();
        return res.json({ success: true, tracking: serializeTracking(tracking) });
    } catch (error) {
        console.error('Toggle keyword error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update keyword tracking' });
    }
};

export const refreshKeyword = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return notFound(res);
    try {
        const tracking = await KeywordTracking.findOne({ _id: req.params.id, userId: req.userId });
        if (!tracking) return notFound(res);
        const startedTracking = await KeywordTracking.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId, status: { $ne: 'checking' } },
            { $set: { status: 'checking', lastError: '', checkStartedAt: new Date() } },
            { returnDocument: 'after' },
        );
        if (!startedTracking) {
            return res.status(409).json({ success: false, message: 'A rank check is already in progress' });
        }

        await runRankCheck(startedTracking);
        const completedTracking = await KeywordTracking.findOne({ _id: req.params.id, userId: req.userId });
        return res.json({ success: true, tracking: serializeTracking(completedTracking || startedTracking) });
    } catch (error) {
        console.error('Start rank check error:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to start rank check' });
    }
};

export const runDailyRankChecks = async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
        return res.status(503).json({ success: false, message: 'Scheduled rank checks are not configured' });
    }
    if (!isValidCronAuthorization(req.get('authorization'), secret)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const now = new Date();
    const dueBefore = new Date(now.getTime() - DAY_IN_MS);
    const staleBefore = new Date(now.getTime() - STALE_CHECK_IN_MS);
    const dueOrStaleFilter = {
        active: true,
        $or: [
            {
                status: { $ne: 'checking' },
                $or: [{ lastChecked: null }, { lastChecked: { $lte: dueBefore } }],
            },
            {
                status: 'checking',
                $or: [{ checkStartedAt: null }, { checkStartedAt: { $lte: staleBefore } }],
            },
        ],
    };

    try {
        const candidates = await KeywordTracking.find(dueOrStaleFilter)
            .select('_id')
            .sort({ lastChecked: 1 })
            .lean();
        let checked = 0;
        let succeeded = 0;
        let failed = 0;

        for (const { _id } of candidates) {
            const tracking = await KeywordTracking.findOneAndUpdate(
                { _id, ...dueOrStaleFilter },
                { $set: { status: 'checking', lastError: '', checkStartedAt: now } },
                { returnDocument: 'after' },
            );
            if (!tracking) continue;

            checked += 1;
            if (await runRankCheck(tracking)) succeeded += 1;
            else failed += 1;

            if (checked < candidates.length) {
                await new Promise((resolve) => setTimeout(resolve, DAILY_CHECK_DELAY_MS));
            }
        }

        return res.json({
            success: true,
            checked,
            succeeded,
            failed,
            skipped: candidates.length - checked,
        });
    } catch (error) {
        console.error('Daily rank checks failed:', error.message);
        return res.status(500).json({ success: false, message: 'Could not run scheduled rank checks' });
    }
};

async function runRankCheck(tracking) {
    try {
        const result = await rankTracker(tracking.keyword, tracking.domain);
        if (!result.success) {
            throw new Error(result.error || 'Rank check failed');
        }

        const previousPosition = tracking.currentPosition;
        const currentPosition = result.data.position;
        const checkedAt = new Date();
        const positionChange = previousPosition !== null && currentPosition !== null
            ? previousPosition - currentPosition
            : 0;
        const bestPosition = currentPosition !== null
            && (tracking.bestPosition === null || currentPosition < tracking.bestPosition)
            ? currentPosition
            : tracking.bestPosition;
        const updated = await KeywordTracking.updateOne(
            {
                _id: tracking._id,
                userId: tracking.userId,
                status: 'checking',
                checkStartedAt: tracking.checkStartedAt,
            },
            {
                $set: {
                    currentPosition,
                    currentPage: result.data.page,
                    competitors: result.data.competitors,
                    resultsScanned: result.data.totalResultScanned,
                    lastError: '',
                    positionChange,
                    bestPosition,
                    lastChecked: checkedAt,
                    status: 'completed',
                    checkStartedAt: null,
                },
                $push: {
                    rankHistory: {
                        date: checkedAt,
                        position: currentPosition,
                        page: result.data.page,
                        title: result.data.title,
                        snippet: result.data.snippet,
                        resultsScanned: result.data.totalResultScanned,
                    },
                },
            },
        );
        return updated.modifiedCount === 1;
    } catch (error) {
        console.error('Rank check failed:', error.message);
        try {
            await KeywordTracking.updateOne(
                {
                    _id: tracking._id,
                    userId: tracking.userId,
                    status: 'checking',
                    checkStartedAt: tracking.checkStartedAt,
                },
                { $set: { status: 'failed', lastError: rankCheckErrorMessage(error), checkStartedAt: null } },
            );
        } catch (updateError) {
            console.error('Could not save failed rank-check state:', updateError.message);
        }
        return false;
    }
}
