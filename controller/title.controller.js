const Title = require("../models/title.model.js"); 
const { getFromCache,saveToCache,deleteFromCache } = require("../services/redisCache.service.js");

const createTitle = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { title_name } = req.body;

    if (!title_name) {
      return res.status(400).json({ error: "Title name is required" });
    }

    const newTitle = new Title({ 
      title_name,
      user_id
    });

    await newTitle.save();

    await deleteFromCache('titles:all');

    res.status(201).json({
      msg: "create title completed!!",
      status: 201,
      title: newTitle,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to create title" });
  }
};

const getAllTitles = async (req, res) => {
  try {
    const cacheKey = 'titles:all';

    const cached = await getFromCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        msg: "fetch titles completed!!",
        status: 200,
        titles: cached,
      });
    }

    const titles = await Title.find();

    await saveToCache(cacheKey, titles, 3600);

    res.status(200).json({
      msg: "fetch titles completed!!",
      status: 200,
      titles,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch titles" });
  }
};

const getTitleById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `titles:${id}`;

    const cached = await getFromCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        msg: "fetch title completed!!",
        status: 200,
        title: cached,
      });
    }

    const title = await Title.findById(id);

    if (!title) {
      return res.status(404).json({ error: "Title not found" });
    }

    await saveToCache(cacheKey, title, 3600);

    res.status(200).json({
      msg: "fetch title completed!!",
      status: 200,
      title,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch title" });
  }
};

const updateTitle = async (req, res) => {
  try {
    const { id } = req.params; 
    const { title_name } = req.body; 
    const userId = req.user.id;

    const title = await Title.findById(id);

    if (!title) {
      return res.status(404).json({ error: "Title not found" });
    }

    if (title.user_id.toString() !== userId) {
      return res.status(403).json({ msg: "You don't have access to this title!!" });
    }

    const updatedTitle = await Title.findByIdAndUpdate(
      id,
      { title_name },
      { new: true, runValidators: true }
    );

    await Promise.all([
      deleteFromCache('titles:all'),
      deleteFromCache(`titles:${id}`)
    ]);

    res.status(200).json({
      msg: "update titles completed!!",
      status: 200,
      title: updatedTitle,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to update title" });
  }
};

const deleteTitle = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTitle = await Title.findByIdAndDelete(id);

    if (!deletedTitle) {
      return res.status(404).json({ error: "Title not found" });
    }

    await Promise.all([
      deleteFromCache('titles:all'),
      deleteFromCache(`titles:${id}`)
    ]);

    res.status(200).json({
      msg: "delete title completed!!",
      status: 200,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to delete title" });
  }
};

module.exports = {
  getAllTitles,
  getTitleById,
  createTitle,
  updateTitle,
  deleteTitle,
};
