const DailyScrumPost = require("../models/daily-scrum-post.model.js");
const {
  uploadFile,
  getObjectSignedUrl,
  deleteFile,
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
      user_id, // Set user_id from the decoded token
      files: savedFileKeys,
      createdAt: customCreatedAt,
      updatedAt: new Date(),
    });

    // Save the new post
    await newPost.save();

    // Return the newly created post
    res.status(201).json({
      msg: "create daily-scrum completed!!",
      status: 201,
      dailyScrum: newPost 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to create post" });
  }
};

const updateDailyScrumPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id; // From the 'auth' middleware

    // Find the existing post
    const post = await DailyScrumPost.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if the user owns the post
    if (post.user_id.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { title, daily, problem, todo, review, createdAt } = req.body;

    // Update text fields if provided
    if (title !== undefined) post.title = title;
    if (daily !== undefined) post.daily = daily;
    if (problem !== undefined) post.problem = problem;
    if (todo !== undefined) post.todo = todo;
    if (createdAt !== undefined) post.createdAt = new Date(createdAt);

    // If files are uploaded, replace or add them
    if (req.files && req.files.length > 0) {
      const savedFileKeys = [];

      for (const file of req.files) {
        const savedFile = await uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        savedFileKeys.push(savedFile.Key);
      }

      // Sort and update files
      savedFileKeys.sort((a, b) => a.localeCompare(b));
      post.files = savedFileKeys;
    }

    // Update the updatedAt timestamp
    post.updatedAt = new Date();

    // Save changes
    await post.save();

    res.status(200).json({
      msg: "update daily-scrum completed!!",
      status: 200,
      dailyScrum: post

    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to update post" });
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
    const dailyScrumWithUrls = await Promise.all(
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

    res.status(200).json({
      msg: "fetch daily-scrums completed!!",
      status: 200,
      dailyScrumPosts: dailyScrumWithUrls
    });
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

    const dailyScrumWithUrls = {
      ...dailyScrumPost.toObject(),
      fileUrls, // Include the URLs in the response
    };

    res.status(200).json({
      msg: "fetch daily-scrum completed!!",
      status: 200,
      dailyScrum: dailyScrumWithUrls
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch daily scrum post" });
  }
};

const deleteDailyScrumPost = async (req, res) => {
  try {
    const { id } = req.params; // Using req.params to get the postId from URL

    // Find the DailyScrumPost by postId
    const post = await DailyScrumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "DailyScrumPost not found" });
    }

    // Delete associated files if they exist
    if (post.files && post.files.length > 0) {
      const deletePromises = post.files.map((fileName) => deleteFile(fileName));
      await Promise.all(deletePromises);
    } else {
      console.log("No files to delete in this Daily Scrum post.");
    }

    // Remove the post from the database
    await DailyScrumPost.findByIdAndDelete(id);

    // Send success response
    res.status(200).json({
      msg: "delete daily-scrum completed!!",
      status: 200
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to delete files and post" });
  }
};

module.exports = {
  createDailyScrumPost,
  updateDailyScrumPost,
  getAllDailyScrum,
  getDailyScrumByID,
  deleteDailyScrumPost,
};
