const DailyScrumPost = require("../models/daily-scrum-post.model.js");
const { handleFilesUpload } = require("../services/fileUpload.service.js");
const { getObjectSignedUrl, deleteFile } = require("../services/storage.service.js");

const createDailyScrumPost = async (req, res) => {
  try {
    const user_id = req.user.id;
    const username = req.user.username;
    const files = req.files;

    const { title, daily, problem, todo, createdAt } = req.body;

    const customCreatedAt = createdAt ? new Date(createdAt) : new Date();

    const uploadFiles = await handleFilesUpload(files)
    
    const allUploadedFiles = [
      ...uploadFiles.image,
      ...uploadFiles.other
    ];
    
    const newPost = new DailyScrumPost({
      title,
      daily,
      problem,
      todo,
      writer: username,
      user_id,
      files: allUploadedFiles, // ✅ Flattened array of strings
      createdAt: customCreatedAt,
      updatedAt: new Date(),
    });

    const FileDetails = await Promise.all(
      allUploadedFiles.map(async (file) => ({
        name: file,
        url: await getObjectSignedUrl(file),
      }))
    );    

    await newPost.save();

    res.status(201).json({
      msg: "create daily-scrum completed!!",
      status: 201,
      dailyScrum: {
        ...newPost.toObject(),
        files: FileDetails
      },
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
      const uploadFiles = await handleFilesUpload(req.files);

      const newFiles = [
        ...uploadFiles.image,
        ...uploadFiles.other
      ];

      // Append new files to existing files
      post.files = (post.files || []).concat(newFiles);
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

    const dailyScrumWithFiles = await Promise.all(
      dailyScrumPosts.map(async (post) => {
        const files = await Promise.all(
          post.files.map(async (fileName) => ({
            name: fileName,
            url: await getObjectSignedUrl(fileName),
          }))
        );

        return {
          ...post.toObject(),
          files,
        };
      })
    );

    res.status(200).json({
      msg: "Fetch daily-scrums completed!!",
      status: 200,
      dailyScrums: dailyScrumWithFiles,
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

    const files = await Promise.all(
      dailyScrumPost.files.map(async (fileName) => ({
        name: fileName,
        url: await getObjectSignedUrl(fileName),
      }))
    );

    const dailyScrumWithFiles = {
      ...dailyScrumPost.toObject(),
      files,
    };

    res.status(200).json({
      msg: "fetch daily-scrum completed!!",
      status: 200,
      dailyScrum: dailyScrumWithFiles,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch daily scrum post" });
  }
};

const deleteDailyScrumPost = async (req, res) => {
  try {
      const { id } = req.params
      const dailyScrum = await DailyScrumPost.findById(id)

      if (!dailyScrum) return res.status(404).json({ message: 'Daily-scrum not found' })

      const allFiles = [...dailyScrum.files]
      const deletePromises = allFiles.map(deleteFile)

      await Promise.all(deletePromises)
      await DailyScrumPost.findByIdAndDelete(id)

      res.status(200).json({ 
          message: 'DailyScrumPost deleted successfully!' 
      })
  } catch (error) {
      res.status(500).json({
          message: 'Internal Server Error',
          error: error.message,
      })
  }
}

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
      reviews: post.review,
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
      review,
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
