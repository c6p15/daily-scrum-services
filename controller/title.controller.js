const Title = require("../models/title.model.js");
const User = require("../models/user.model.js");

const { getFromCache,saveToCache,deleteFromCache } = require("../services/redisCache.service.js");

const createTitle = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { title, member = [] } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const newTitle = new Title({
      title: title.trim(),
      member,
      user_id
    });

    
    await newTitle.save();

    await deleteFromCache('titles:all');

    await Promise.all(
      newTitle.member.map(id =>
        deleteFromCache(`titles:all:user:${id.toString()}`)
      )
    );

    await deleteFromCache(`titles:all:user:${user_id}`);

    const users = await User.find({ _id: { $in: newTitle.member } }, 'username');

    res.status(201).json({
      msg: "Create title completed!",
      status: 201,
      title: {
        ...newTitle.toObject(),
        member: users
      }
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
        msg: "Fetch titles completed!",
        status: 200,
        titles: cached,
      });
    }

    const titles = await Title.find();

    const titlesWithUsernames = await Promise.all(
      titles.map(async (title) => {
        const members = await User.find({ _id: { $in: title.member } }, 'username');
        return {
          ...title.toObject(),
          member: members
        };
      })
    );

    await saveToCache(cacheKey, titlesWithUsernames, 3600);

    res.status(200).json({
      msg: "Fetch titles completed!",
      status: 200,
      titles: titlesWithUsernames,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch titles" });
  }
};

const getAllUserTitles = async (req, res) => {
  try {
    const user_id = req.user.id;
    const cacheKey = `titles:all:user:${user_id}`;

    const cached = await getFromCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        msg: "Fetch titles completed!",
        status: 200,
        titles: cached,
      });
    }

    const titles = await Title.find({ member: user_id });

    const titlesWithUsernames = await Promise.all(
      titles.map(async (title) => {
        const members = await User.find({ _id: { $in: title.member } }, 'username');
        return {
          ...title.toObject(),
          member: members
        };
      })
    );

    await saveToCache(cacheKey, titlesWithUsernames, 3600);

    res.status(200).json({
      msg: "Fetch titles completed!",
      status: 200,
      titles: titlesWithUsernames,
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
        msg: "Fetch title completed!",
        status: 200,
        title: cached,
      });
    }

    const title = await Title.findById(id);
    if (!title) {
      return res.status(404).json({ error: "Title not found" });
    }

    const members = await User.find({ _id: { $in: title.member } }, 'username');

    const response = {
      ...title.toObject(),
      member: members
    };

    await saveToCache(cacheKey, response, 3600);

    res.status(200).json({
      msg: "Fetch title completed!",
      status: 200,
      title: response,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to fetch title" });
  }
};

const updateTitle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, member } = req.body;
    const userId = req.user.id;

    const existingTitle = await Title.findById(id);
    if (!existingTitle) {
      return res.status(404).json({ error: "Title not found" });
    }

    if (existingTitle.user_id.toString() !== userId) {
      return res.status(403).json({ msg: "You don't have access to this title!" });
    }

    if (title) existingTitle.title = title.trim();
    if (member) existingTitle.member = member;

    await existingTitle.save();

    await Promise.all([
      deleteFromCache('titles:all'),
      deleteFromCache(`titles:${id}`)
    ]);

    const members = await User.find({ _id: { $in: existingTitle.member } }, 'username');

    res.status(200).json({
      msg: "Update title completed!",
      status: 200,
      title: {
        ...existingTitle.toObject(),
        member: members
      }
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

    // Clear all relevant caches
    const cacheKeys = [
      'titles:all',
      `titles:${id}`,
      ...deletedTitle.member.map(uid => `titles:all:user:${uid.toString()}`),
      `titles:all:user:${deletedTitle.user_id.toString()}`
    ];

    await Promise.all(cacheKeys.map(deleteFromCache));

    res.status(200).json({
      msg: "Delete title completed!!",
      status: 200,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Failed to delete title" });
  }
};

module.exports = {
  getAllTitles,
  getAllUserTitles,
  getTitleById,
  createTitle,
  updateTitle,
  deleteTitle,
};
