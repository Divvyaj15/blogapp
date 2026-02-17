const Comment = require('../models/Comment');

const commentController = {
  // POST /api/posts/:id/comments
  addComment: async (req, res) => {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    const comment = await Comment.create(
      req.user.id,
      req.params.id,
      content.trim()
    );

    res.status(201).json({ comment });
  },

  // DELETE /api/posts/:postId/comments/:commentId
  deleteComment: async (req, res) => {
    const ownerId = await Comment.getOwnerId(req.params.commentId);
    if (!ownerId) return res.status(404).json({ error: 'Comment not found.' });
    if (ownerId !== req.user.id) return res.status(403).json({ error: 'Not authorized.' });

    await Comment.delete(req.params.commentId);
    res.json({ message: 'Comment deleted.' });
  },
};

module.exports = commentController;