const express = require('express');
const router = express.Router();
const postController    = require('../controllers/postController');
const likeController    = require('../controllers/likeController');
const commentController = require('../controllers/commentController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

// Feed & single post
router.get('/',     optionalAuth,  postController.getFeed);
router.get('/:slug', optionalAuth, postController.getPost);

// Post CRUD
router.post('/',     authMiddleware, postController.createPost);
router.put('/:id',   authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

// Likes
router.post('/:id/like', authMiddleware, likeController.toggleLike);

// Comments
router.post('/:id/comments',                   authMiddleware, commentController.addComment);
router.delete('/:postId/comments/:commentId',  authMiddleware, commentController.deleteComment);

module.exports = router;