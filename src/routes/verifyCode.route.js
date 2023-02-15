var express = require("express");
var router = express.Router();

router.get("/get", (req, res) => {
  return res.status(200).json("this is /user page");
});

module.exports = router;
