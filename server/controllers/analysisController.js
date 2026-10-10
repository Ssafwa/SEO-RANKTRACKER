import mongoose from 'mongoose';
import SEOAnalysis from '../models/SEOAnalysis.js';
import User from '../models/User.js';
import { addAiRecommendations, auditWebsite } from '../services/websiteAuditService.js';

const reportNotFound = (res) => res.status(404).json({ success: false, message: 'Analysis not found' });

export const createAnalysis = async (req, res) => {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    if (!url || url.length > 2048) {
        return res.status(400).json({ success: false, message: 'Enter a valid website URL under 2048 characters' });
    }

    try {
        const analysis = await SEOAnalysis.create({ userId: req.userId, url, status: 'processing' });
        void runAnalysis(analysis);
        return res.status(202).json({ success: true, analysis: { _id: analysis._id, url, status: analysis.status } });
    } catch (error) {
        console.error('Could not start SEO analysis:', error.message);
        return res.status(500).json({ success: false, message: 'Could not start website analysis' });
    }
};

export const listAnalyses = async (req, res) => {
    const requestedPage = Number.parseInt(req.query.page, 10);
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 10;
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 200) : '';
    const requestedStatus = typeof req.query.status === 'string' ? req.query.status : 'all';
    const status = ['processing', 'completed', 'failed'].includes(requestedStatus) ? requestedStatus : 'all';
    const requestedSort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
    const sortOptions = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        score_high: { overallScore: -1, createdAt: -1 },
        score_low: { overallScore: 1, createdAt: -1 },
    };
    const sort = sortOptions[requestedSort] || sortOptions.newest;

    try {
        const filter = { userId: req.userId };
        if (status !== 'all') filter.status = status;
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.url = { $regex: escapedSearch, $options: 'i' };
        }
        const [analyses, total] = await Promise.all([
            SEOAnalysis.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
            SEOAnalysis.countDocuments(filter),
        ]);
        return res.json({
            success: true,
            analyses,
            page,
            totalPages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error('Could not list SEO analyses:', error.message);
        return res.status(500).json({ success: false, message: 'Could not load analysis history' });
    }
};

export const getAnalysis = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return reportNotFound(res);
    try {
        const analysis = await SEOAnalysis.findOne({ _id: req.params.id, userId: req.userId }).lean();
        if (!analysis) return reportNotFound(res);
        return res.json({ success: true, analysis });
    } catch (error) {
        console.error('Could not load SEO analysis:', error.message);
        return res.status(500).json({ success: false, message: 'Could not load analysis report' });
    }
};

export const retryAiRecommendations = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return reportNotFound(res);
    try {
        const analysis = await SEOAnalysis.findOne({
            _id: req.params.id,
            userId: req.userId,
            status: 'completed',
        }).lean();
        if (!analysis) return reportNotFound(res);

        const started = await SEOAnalysis.findOneAndUpdate(
            {
                _id: req.params.id,
                userId: req.userId,
                status: 'completed',
                aiStatus: { $ne: 'processing' },
            },
            { $set: { aiStatus: 'processing', aiError: '' } },
            { returnDocument: 'after' },
        ).lean();
        if (!started) {
            return res.status(409).json({ success: false, message: 'AI recommendations are already being generated' });
        }

        void generateRecommendations(started);
        return res.status(202).json({
            success: true,
            message: 'AI recommendations are being generated',
            analysis: { _id: started._id, aiStatus: started.aiStatus },
        });
    } catch (error) {
        console.error('Could not retry AI recommendations:', error.message);
        return res.status(500).json({ success: false, message: 'Could not start AI recommendations' });
    }
};

export const deleteAnalysis = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return reportNotFound(res);
    try {
        const analysis = await SEOAnalysis.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!analysis) return reportNotFound(res);
        return res.json({ success: true });
    } catch (error) {
        console.error('Could not delete SEO analysis:', error.message);
        return res.status(500).json({ success: false, message: 'Could not delete analysis' });
    }
};

async function generateRecommendations(analysis) {
    try {
        const measuredIssues = Array.isArray(analysis.measuredIssues)
            ? analysis.measuredIssues
            : analysis.issues;
        const result = await addAiRecommendations({
            url: analysis.url,
            categories: analysis.categories,
            loadTime: analysis.loadTime,
            pageSize: analysis.pageSize,
            wordCount: analysis.wordCount,
            metaData: analysis.metaData,
            headings: analysis.headings,
            links: analysis.links,
            images: analysis.images,
            issues: measuredIssues,
            measuredIssues,
            aiIssues: analysis.aiIssues || [],
        });
        await SEOAnalysis.updateOne(
            { _id: analysis._id, userId: analysis.userId, status: 'completed', aiStatus: 'processing' },
            {
                $set: {
                    issues: result.issues,
                    measuredIssues: result.measuredIssues,
                    aiIssues: result.aiIssues,
                    aiSummary: result.aiSummary,
                    aiStatus: result.aiStatus,
                    aiError: result.aiError || '',
                },
            },
        );
    } catch (error) {
        console.error('Could not save AI recommendations:', error.message);
        try {
            await SEOAnalysis.updateOne(
                { _id: analysis._id, userId: analysis.userId, status: 'completed', aiStatus: 'processing' },
                {
                    $set: {
                        aiStatus: 'failed',
                        aiError: 'Recommendations were generated but could not be saved. Please retry.',
                    },
                },
            );
        } catch (updateError) {
            console.error('Could not save failed AI recommendation state:', updateError.message);
        }
    }
}

async function runAnalysis(analysis) {
    try {
        const result = await auditWebsite(analysis.url);
        const { url, ...data } = result;
        const saved = await SEOAnalysis.updateOne(
            { _id: analysis._id, userId: analysis.userId, status: 'processing' },
            { $set: { url, ...data, status: 'completed', error: '' } },
        );
        if (saved.modifiedCount) {
            try {
                await User.updateOne(
                    { _id: analysis.userId },
                    { $inc: { analysisCount: 1 }, $set: { lastAnalysisDate: new Date() } },
                );
            } catch (error) {
                console.error('Could not increment user audit count:', error.message);
            }
        }
    } catch (error) {
        console.error('Website analysis failed:', error.message);
        try {
            await SEOAnalysis.updateOne(
                { _id: analysis._id, userId: analysis.userId, status: 'processing' },
                {
                    $set: {
                        status: 'failed',
                        error: error.message || 'Website could not be analyzed',
                        aiStatus: process.env.AI_API_KEY ? 'failed' : 'unavailable',
                    },
                },
            );
        } catch (updateError) {
            console.error('Could not save failed website analysis state:', updateError.message);
        }
    }
}
