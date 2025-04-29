const DailyScrumPost = require("../models/daily-scrum-post.model.js");
const {
  uploadFile,
  getObjectSignedUrl,
  deleteFile,
} = require("../services/fileStorage.service.js");

const createDailyScrumPost = async (req, res) => {
  try {
    const user_id = req.user.id;
    const username = req.user.username;

    const { title, daily, problem, todo, createdAt } = req.body;

    const savedFileKeys = [];
    for (const file of req.files) {
      const savedFile = await uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      savedFileKeys.push(savedFile.Key);
    }

    savedFileKeys.sort((a, b) => a.localeCompare(b));

    const customCreatedAt = createdAt ? new Date(createdAt) : new Date();

    const newPost = new DailyScrumPost({
      title,
      daily,
      problem,
      todo,
      writer: username,
      user_id, 
      files: savedFileKeys,
      createdAt: customCreatedAt,
      updatedAt: new Date(),
    });

    await newPost.save();

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
    const userId = req.user.id; 

    const post = await DailyScrumPost.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.user_id.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const { title, daily, problem, todo } = req.body;

    if (title !== undefined) post.title = title;
    if (daily !== undefined) post.daily = daily;
    if (problem !== undefined) post.problem = problem;
    if (todo !== undefined) post.todo = todo;

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

      savedFileKeys.sort((a, b) => a.localeCompare(b));
      post.files = savedFileKeys;
    }

    post.updatedAt = new Date();

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

    const query = {};
    if (title) {
      query.title = { $regex: title, $options: "i" };
    }

    const dailyScrumPosts = await DailyScrumPost.find(query)
      .populate("user_id", "username email")
      .sort({ createdAt: -1 });

    if (!dailyScrumPosts || dailyScrumPosts.length === 0) {
      return res.status(404).json({ message: "No daily scrum posts found." });
    }

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

const getDailyScrumByID = async (req, res) => {
  try {
    const { id } = req.params;

    const dailyScrumPost = await DailyScrumPost.findById(id)
      .populate("user_id", "username email")
      .exec();

    if (!dailyScrumPost) {
      return res.status(404).json({ message: "Daily scrum post not found." });
    }

    const fileUrls = await Promise.all(
      dailyScrumPost.files.map(async (fileName) => {
        return await getObjectSignedUrl(fileName); 
      })
    );

    const dailyScrumWithUrls = {
      ...dailyScrumPost.toObject(),
      fileUrls,
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
    const { id } = req.params; 

    const post = await DailyScrumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "DailyScrumPost not found" });
    }

    if (post.files && post.files.length > 0) {
      const deletePromises = post.files.map((fileName) => deleteFile(fileName));
      await Promise.all(deletePromises);
    } else {
      console.log("No files to delete in this Daily Scrum post.");
    }

    await DailyScrumPost.findByIdAndDelete(id);

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

    const reviewer = req.user.username;

    const post = await DailyScrumPost.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newReview = {
      review_text,
      score,
      reviewer, 
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

    const post = await DailyScrumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "DailyScrumPost not found" });
    }

    const reviewInfo = post.review.id(reviewId);

    if (!reviewInfo) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review_text !== undefined) reviewInfo.review_text = review_text;
    if (score !== undefined) reviewInfo.score = score;

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

    res.status(200).json({ 
      msg: "fetch reviews completed!!",
      status: 200,
      reviews: post.review 
    });
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

    res.status(200).json({
      msg: "fetch review completed!!",
      status: 200,
      review
    });
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

    const reviewIndex = post.review.findIndex(
      (review) => review._id.toString() === reviewId
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ error: "Review not found" });
    }

    post.review.splice(reviewIndex, 1);

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
