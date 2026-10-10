import mongoose from 'mongoose';

const rankHistorySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    position: { type: Number, default: null },
    page: { type: Number, default: null },
    title: { type: String, default: '' },
    snippet: { type: String, default: '' },
    resultsScanned: { type: Number, default: 0 },
}, { _id: false });

const competitorSchema = new mongoose.Schema({
    position: { type: Number, required: true },
    url: { type: String, required: true },
    domain: { type: String, required: true },
    title: { type: String, default: '' },
    snippet: { type: String, default: '' },
}, { _id: false });

const keywordTrackingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    keyword: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    domain: { type: String, required: true, trim: true },
    currentPosition: { type: Number, default: null },
    currentPage: { type: Number, default: null },
    bestPosition: { type: Number, default: null },
    positionChange: { type: Number, default: 0 },
    rankHistory: { type: [rankHistorySchema], default: [] },
    competitors: { type: [competitorSchema], default: [] },
    resultsScanned: { type: Number, default: 0 },
    lastError: { type: String, default: '' },
    checkStartedAt: { type: Date, default: null },
    active: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'checking', 'completed', 'failed'], default: 'pending' },
    lastChecked: { type: Date, default: null },
}, { timestamps: true });

export default mongoose.model('KeywordTracking', keywordTrackingSchema, 'keywordtrackings');
17570683