const { redisClient } = require("../config/redis.js");

const getFromCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis Get Error:", err.message);
    return null;
  }
};

const saveToCache = async (key, value, ttl = 3600) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error("Redis Set Error:", err.message);
  }
};

const deleteFromCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error("Redis Delete Error:", err.message);
  }
};

module.exports = {
  getFromCache,
  saveToCache,
  deleteFromCache,
};
