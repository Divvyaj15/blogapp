const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

router.get('/',                         userController.searchUsers);
router.get('/:username',    optionalAuth, userController.getProfile);
router.get('/:username/posts', optionalAuth, userController.getUserPosts);
router.post('/:username/follow', authMiddleware, userController.toggleFollow);
router.get('/:username/followers', userController.getFollowers);
router.get('/:username/following', userController.getFollowing);

module.exports = router;