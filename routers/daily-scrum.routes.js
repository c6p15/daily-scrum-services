
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth.js')

const { createDailyScrumPost, updateDailyScrumPost, getAllDailyScrum, getDailyScrumByID, deleteDailyScrumPost, addReview, updateReview, getAllReviews, getReviewById, deleteReview, deleteSingleFile } = require('../controller/daily-scrum-post.controller.js');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', auth, upload.array('files', 10), createDailyScrumPost);
router.patch('/:id', auth, upload.array('files', 10), updateDailyScrumPost);
router.get('/', getAllDailyScrum)
router.get('/:id', getDailyScrumByID)
router.delete('/:id', auth, deleteDailyScrumPost)
router.delete('/:id/file', auth, deleteSingleFile)

router.post('/:id/review', auth, addReview)
router.patch('/:id/review/:reviewId', auth, updateReview)
router.get('/:id/review', getAllReviews)
router.get('/:id/review/:reviewId', getReviewById)
router.delete('/:id/review/:reviewId', auth, deleteReview)

module.exports = router;
