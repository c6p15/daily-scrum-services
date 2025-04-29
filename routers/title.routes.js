
const express = require('express');
const router = express.Router();
const { createTitle, getAllTitles, getTitleById, updateTitle, deleteTitle} = require('../controller/title.controller.js');
const auth = require('../middleware/auth.js');

router.post('/', auth, createTitle);           
router.get('/', getAllTitles);
router.get('/:id', getTitleById);
router.put('/:id', auth, updateTitle);
router.delete('/:id', deleteTitle);

module.exports = router;
