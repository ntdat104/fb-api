const express = require("express");
const eightController = require("../controllers/eight.controller.js");
const router = express.Router();

router.post("/set_accept_friend", eightController.setAcceptFriend);
router.post("/get_list_suggested_friends", eightController.getListSuggestedFriends);
router.post("/set_request_friend", eightController.setRequestFriend);
router.post("/get_list_blocks", eightController.getListBlocks);

module.exports = router;
