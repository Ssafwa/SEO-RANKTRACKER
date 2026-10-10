import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
    severity: { type: String, enum: ['critical', 'warning', 'info'] },
    category: String,
    message: String,
    recommendation: String,
}, { _id: false });

const seoAnalysisSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    url: { type: String, required: true },
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    error: { type: String, default: '' },
    overallScore: { type: Number, default: 0 },
    categories: {
        seo: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
        accessibility: { type: Number, default: 0 },
        bestPractices: { type: Number, default: 0 },
    },
    loadTime: { type: Number, default: 0 },
    pageSize: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    metaData: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        canonical: { type: String, default: '' },
        robots: { type: String, default: '' },
        ogTitle: { type: String, default: '' },
        ogDescription: { type: String, default: '' },
        ogImage: { type: String, default: '' },
        twitterCard: { type: String, default: '' },
        viewport: { type: String, default: '' },
        charset: { type: String, default: '' },
    },
    headings: {
        h1: { type: Number, default: 0 },
        h2: { type: Number, default: 0 },
        h3: { type: Number, default: 0 },
        h4: { type: Number, default: 0 },
        h5: { type: Number, default: 0 },
        h6: { type: Number, default: 0 },
        h1Texts: { type: [String], default: [] },
    },
    links: {
        internal: { type: Number, default: 0 },
        external: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
    },
    images: {
        total: { type: Number, default: 0 },
        missingAlt: { type: Number, default: 0 },
        withAlt: { type: Number, default: 0 },
    },
    keywords: {
        type: [{
            word: String,
            count: Number,
            density: Number,
        }],
        default: [],
    },
    issues: { type: [issueSchema], default: [] },
    measuredIssues: { type: [issueSchema], default: [] },
    aiIssues: { type: [issueSchema], default: [] },
    aiSummary: { type: String, default: '' },
    aiError: { type: String, default: '' },
    aiStatus: { type: String, enum: ['completed', 'processing', 'unavailable', 'failed'], default: 'unavailable' },
}, { timestamps: true });

seoAnalysisSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('SEOAnalysis', seoAnalysisSchema);
