import express from 'express';
import { createAnalysis, deleteAnalysis, getAnalysis, listAnalyses, retryAiRecommendations } from '../controllers/analysisController.js';

const router = express.Router();

router.post('/', createAnalysis);
router.get('/', listAnalyses);
router.post('/:id/ai-recommendations', retryAiRecommendations);
router.get('/:id', getAnalysis);
router.delete('/:id', deleteAnalysis);

export default router;
