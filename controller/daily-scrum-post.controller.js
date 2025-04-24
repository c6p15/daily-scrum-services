const DailyScrumPost = require("../models/daily-scrum-post.model.js");
const {
  uploadFile,
  getObjectSignedUrl,
} = require("../services/fileStorage.service.js");

const createDailyScrumPost = async (req, res) => {
  try {
    // The user ID is now available from the decoded token in req.user.id
    const user_id = req.user.id; // This comes from the 'auth' middleware

    const { title, daily, problem, todo, review, createdAt } = req.body;

    // Use the uploaded files
    const savedFileKeys = [];
    for (const file of req.files) {
      const savedFile = await uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      savedFileKeys.push(savedFile.Key);
    }

    // Sort the file names (if needed)
    savedFileKeys.sort((a, b) => a.localeCompare(b));

    // If createdAt is not passed, use current time
    const customCreatedAt = createdAt ? new Date(createdAt) : new Date();

    // Create new post with the user_id from the auth middleware
    const newPost = new DailyScrumPost({
      title,
      daily,
      problem,
      todo,
      review: review ? JSON.parse(review) : [],
      user_id, // Set user_id from the decoded token
      files: savedFileKeys,
      createdAt: customCreatedAt,
      updatedAt: new Date(),
    });

    // Save the new post
    await newPost.save();

    // Return the newly created post
    res.status(201).json(newPost);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to create post" });
  }
};

const getAllDailyScrum = async (req, res) => {
  try {
    const dailyScrumPosts = await DailyScrumPost.find()
      .populate("user_id", "username email") // Optional: Populate user details
      .sort({ createdAt: -1 });

    if (!dailyScrumPosts || dailyScrumPosts.length === 0) {
      return res.status(404).json({ message: "No daily scrum posts found." });
    }

    // Add file URLs to each daily scrum post
    const updatedDailyScrumPosts = await Promise.all(
      dailyScrumPosts.map(async (post) => {
        const fileUrls = await Promise.all(
          post.files.map(async (fileName) => {
            return await getObjectSignedUrl(fileName); // Get the signed URL for each file
          })
        );

        return {
          ...post.toObject(),
          fileUrls, // Include the URLs in the response
        };
      })
    );

    res.status(200).json(updatedDailyScrumPosts);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch daily scrum posts" });
  }
};

// Get Daily Scrum Post by ID
const getDailyScrumByID = async (req, res) => {
  try {
    const { id } = req.params;

    const dailyScrumPost = await DailyScrumPost.findById(id)
      .populate("user_id", "username email")
      .exec();

    if (!dailyScrumPost) {
      return res.status(404).json({ message: "Daily scrum post not found." });
    }

    // Add file URLs to the daily scrum post
    const fileUrls = await Promise.all(
      dailyScrumPost.files.map(async (fileName) => {
        return await getObjectSignedUrl(fileName); // Get the signed URL for each file
      })
    );

    const updatedPost = {
      ...dailyScrumPost.toObject(),
      fileUrls, // Include the URLs in the response
    };

    res.status(200).json(updatedPost);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch daily scrum post" });
  }
};

module.exports = {
  createDailyScrumPost,
  getAllDailyScrum,
  getDailyScrumByID,
};
