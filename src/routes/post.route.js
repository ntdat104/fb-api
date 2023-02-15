const express = require("express");
const router = express.Router();

const postController = require("../controllers/post.controller.js");
const fiveController = require("../controllers/five.controller.js");

router.post("/add_post", postController.addPost);
router.post("/get_post", postController.getPost);
router.post("/edit_post", postController.editPost);
router.post("/delete_post", postController.deletePost);
router.post("/report_post", postController.reportPost);
router.post("/like", postController.like);

router.post("/get_comment", postController.getComment);
router.post("/set_comment", postController.setComment);
router.post("/get_list_posts", fiveController.getListPosts);
router.post("/check_new_item", fiveController.checkNewItem);


router.post("/delete_post_all", postController.deletePostAll);
// router.post("/check_verify_code", postController.checkVerifyCode);

// router.post("/change_info_after_signup", postController.changeInfoAfterSignup);
module.exports = router;
