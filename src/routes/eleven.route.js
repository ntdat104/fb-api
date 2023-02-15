const express = require("express");
const elevenController = require("../controllers/eleven.controller.js");
const router = express.Router();

router.post("/get_conversation", elevenController.getConversation);
router.post("/get_list_conversation", elevenController.getListConversation);
router.post("/set_read_message", elevenController.setReadMessage);
router.post("/delete_message", elevenController.deleteMessage);
router.post("/delete_conversation", elevenController.deleteConversation);

module.exports = router;
