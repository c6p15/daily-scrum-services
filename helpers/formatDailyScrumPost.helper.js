const { getObjectSignedUrl } = require("../services/storage.service.js");

const formatDailyScrumPost = async (postDoc) => {
  if (!postDoc) return null;

  const post = postDoc.toObject();

  post.files = await Promise.all(
    (post.files || []).map(async (fileName) => ({
      name: fileName,
      url: await getObjectSignedUrl(fileName),
    }))
  );

  return post;
};

module.exports = formatDailyScrumPost;
