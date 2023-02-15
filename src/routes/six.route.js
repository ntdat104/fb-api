const express = require("express");
const sixController = require("../controllers/six.controller.js");
const router = express.Router();

router.post("/search", sixController.search);
router.post("/get_saved_search", sixController.getSavedSearch);
router.post("/del_saved_search", sixController.delSavedSearch);

module.exports = router;
