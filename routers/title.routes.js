
const express = require('express');
const router = express.Router();
const {
    createTitle,
    getAllTitles,
    getTitleById,
    updateTitleById,
    deleteTitleById
} = require('../controller/title.controller.js');

// Define the routes for CRUD operations
router.post('/', createTitle);           // Create a new title
router.get('/', getAllTitles);         // Get all titles
router.get('/:id', getTitleById);     // Get a title by ID
router.put('/:id', updateTitleById);  // Update a title by ID
router.delete('/:id', deleteTitleById); // Delete a title by ID

module.exports = router;
