const express = require("express");
const sevenController = require("../controllers/seven.controller.js");
const router = express.Router();

router.post("/get_requested_friends", sevenController.getRequestedFriends);
router.post("/get_list_videos", sevenController.getListVideos);
router.post("/get_user_friends", sevenController.getUserFriends);

module.exports = router;
