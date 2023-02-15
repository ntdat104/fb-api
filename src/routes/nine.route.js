const express = require("express");
const nineController = require("../controllers/nine.controller.js");
const router = express.Router();

router.post("/change_password", nineController.change_password);
router.post("/set_block", nineController.setBlock);
router.post("/get_push_settings", nineController.getPushSettings);
router.post("/set_push_settings", nineController.setPushSettings);
router.post("/check_new_version", nineController.checkNewVersion);




module.exports = router;
