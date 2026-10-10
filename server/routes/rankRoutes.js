import express from 'express';
import {
    addKeyword,
    deleteKeyword,
    getAllKeywords,
    getKeyword,
    refreshKeyword,
    toggleKeyword,
} from '../controllers/rankController.js';

const router = express.Router();

router.post('/add', addKeyword);
router.get('/', getAllKeywords);
router.get('/list', getAllKeywords);
router.get('/:id', getKeyword);
router.post('/:id/refresh', refreshKeyword);
router.put('/:id/toggle', toggleKeyword);
router.delete('/:id', deleteKeyword);

export default router;