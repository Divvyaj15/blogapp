const Like = require('../models/Like');

const likeController = {
  // POST /api/posts/:id/like  — toggles like on/off
  toggleLike: async (req, res) => {
    const postId = req.params.id;
    const userId = req.user.id;

    const alreadyLiked = await Like.exists(userId, postId);

    if (alreadyLiked) {
      await Like.delete(userId, postId);
    } else {
      await Like.create(userId, postId);
    }

    const likes_count = await Like.countByPost(postId);
    res.json({ liked: !alreadyLiked, likes_count });
  },
};

module.exports = likeController;