
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth.js')

const { createDailyScrumPost, updateDailyScrumPost, getAllDailyScrum, getDailyScrumByID, deleteDailyScrumPost } = require('../controller/daily-scrum-post.controller.js');

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', auth, upload.array('files', 10), createDailyScrumPost);
router.patch('/:id', auth, upload.array('files', 10), updateDailyScrumPost);
router.get('/', getAllDailyScrum)
router.get('/:id', getDailyScrumByID)
router.delete('/:id', auth, deleteDailyScrumPost)

module.exports = router;
