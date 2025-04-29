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
    const username = req.user.username;

    const { title, daily, problem, todo, createdAt } = req.body;

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
      writer: username,
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
      dailyScrum: newPost,
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

    const { title, daily, problem, todo } = req.body;

    // Update text fields if provided
    if (title !== undefined) post.title = title;
    if (daily !== undefined) post.daily = daily;
    if (problem !== undefined) post.problem = problem;
    if (todo !== undefined) post.todo = todo;

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
      dailyScrum: post,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to update post" });
  }
};

const getAllDailyScrum = async (req, res) => {
  try {
    const { title } = req.query;

    // Build the query object
    const query = {};
    if (title) {
      query.title = { $regex: title, $options: "i" }; // Case-insensitive partial match
    }

    const dailyScrumPosts = await DailyScrumPost.find(query)
      .populate("user_id", "username email")
      .sort({ createdAt: -1 });

    if (!dailyScrumPosts || dailyScrumPosts.length === 0) {
      return res.status(404).json({ message: "No daily scrum posts found." });
    }

    // Generate signed URLs for file attachments
    const dailyScrumWithUrls = await Promise.all(
      dailyScrumPosts.map(async (post) => {
        const fileUrls = await Promise.all(
          post.files.map(async (fileName) => {
            return await getObjectSignedUrl(fileName);
          })
        );

        return {
          ...post.toObject(),
          fileUrls,
        };
      })
    );

    res.status(200).json({
      msg: "Fetch daily-scrums completed!!",
      status: 200,
      dailyScrums: dailyScrumWithUrls,
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
      dailyScrum: dailyScrumWithUrls,
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
      status: 200,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to delete files and post" });
  }
};

const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { review_text, score } = req.body;

    // Assume user info is attached via auth middleware
    const reviewer = req.user.username;

    const post = await DailyScrumPost.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newReview = {
      review_text,
      score,
      reviewer, // attach the username here
    };

    post.review.push(newReview);
    await post.save();

    res.status(200).json({
      success: true,
      message: "Review added successfully",
      review: newReview,
      dailyScrum: post,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add review" });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const { review_text, score } = req.body;

    // Find the post
    const post = await DailyScrumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "DailyScrumPost not found" });
    }

    // Find the review by its _id
    const reviewInfo = post.review.id(reviewId);

    if (!reviewInfo) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Patch/update fields if provided
    if (review_text !== undefined) reviewInfo.review_text = review_text;
    if (score !== undefined) reviewInfo.score = score;

    // Save the post
    await post.save();

    res.status(200).json({
      success: true,
      message: "Review patched successfully",
      updatedReview: reviewInfo,
    });
  } catch (error) {
    console.error("Error patching review:", error.message);
    res.status(500).json({ error: "Failed to patch review" });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await DailyScrumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "DailyScrumPost not found" });
    }

    res.status(200).json({ reviews: post.review });
  } catch (error) {
    console.error("Error getting reviews:", error.message);
    res.status(500).json({ error: "Failed to get reviews" });
  }
};

const getReviewById = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const post = await DailyScrumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "DailyScrumPost not found" });
    }

    const review = post.review.id(reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.status(200).json({ review });
  } catch (error) {
    console.error("Error getting review:", error.message);
    res.status(500).json({ error: "Failed to get review" });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id, reviewId } = req.params;
    const post = await DailyScrumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "DailyScrumPost not found" });
    }

    // Find the index of the review by its _id
    const reviewIndex = post.review.findIndex(
      (review) => review._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Remove the review from the array
    post.review.splice(reviewIndex, 1);

    // Save the updated post document
    await post.save();

    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error.message);
    res.status(500).json({ error: "Failed to delete review" });
  }
};

module.exports = {
  createDailyScrumPost,
  updateDailyScrumPost,
  getAllDailyScrum,
  getDailyScrumByID,
  deleteDailyScrumPost,
  addReview,
  updateReview,
  getAllReviews,
  getReviewById,
  deleteReview,
};
