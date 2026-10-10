import mongoose from 'mongoose';

const rankSearchCacheSchema = new mongoose.Schema({
    cacheKey: { type: String, required: true, unique: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

export default mongoose.model('RankSearchCache', rankSearchCacheSchema);
