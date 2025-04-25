const Title = require("../models/title.model.js"); // Import the Title model

// Create a new Title
const createTitle = async (req, res) => {
  try {
    const { title_name } = req.body; // Extract title_name from request body

    // Check if title_name is provided
    if (!title_name) {
      return res.status(400).json({ error: "Title name is required" });
    }

    // Create a new title
    const newTitle = new Title({ title_name });

    // Save the title to the database
    await newTitle.save();

    res.status(201).json({
      success: true,
      message: "Title created successfully",
      title: newTitle,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to create title" });
  }
};

// Get all Titles
const getAllTitles = async (req, res) => {
  try {
    const titles = await Title.find(); // Fetch all titles from the database

    res.status(200).json({
      success: true,
      titles: titles,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch titles" });
  }
};

// Get a single Title by ID
const getTitleById = async (req, res) => {
  try {
    const { id } = req.params; // Get title ID from the URL parameter

    const title = await Title.findById(id); // Find the title by ID

    if (!title) {
      return res.status(404).json({ error: "Title not found" });
    }

    res.status(200).json({
      success: true,
      title: title,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch title" });
  }
};

// Update a Title by ID
const updateTitleById = async (req, res) => {
  try {
    const { id } = req.params; // Get title ID from the URL parameter
    const { title_name } = req.body; // Get new title_name from request body

    // Find and update the title
    const updatedTitle = await Title.findByIdAndUpdate(
      id,
      { title_name },
      { new: true, runValidators: true } // Return the updated document and run validations
    );

    if (!updatedTitle) {
      return res.status(404).json({ error: "Title not found" });
    }

    res.status(200).json({
      success: true,
      message: "Title updated successfully",
      title: updatedTitle,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to update title" });
  }
};

// Delete a Title by ID
const deleteTitleById = async (req, res) => {
  try {
    const { id } = req.params; // Get title ID from the URL parameter

    const deletedTitle = await Title.findByIdAndDelete(id); // Find and delete the title by ID

    if (!deletedTitle) {
      return res.status(404).json({ error: "Title not found" });
    }

    res.status(200).json({
      success: true,
      message: "Title deleted successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to delete title" });
  }
};

module.exports = {
  createTitle,
  getAllTitles,
  getTitleById,
  updateTitleById,
  deleteTitleById,
};
