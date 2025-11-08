/**
 * Merge Queue Routes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const mergeQueueController = require('../controllers/mergQueueController');

// Employee routes
router.get('/my-entries', protect, mergeQueueController.getMyMergeQueueEntries);
router.post('/:queueId/confirm', protect, mergeQueueController.confirmMergeQueueEntry);
router.post('/:queueId/ignore', protect, mergeQueueController.ignoreMergeQueueEntry);

// HR/Admin routes
router.get('/all', protect, mergeQueueController.getMergeQueue);
router.post('/:queueId/mark-as-leave', protect, mergeQueueController.markAsLeave);

module.exports = router;
