const express = require("express");
const afterLogin = require("../controllers/user.controller.js");
const router = express.Router();

router.get("/user", (req, res) => {// test private page
  console.log(req.jwtDecoded)
  return res.status(200).json("this is /user page");
});
router.post("/logout", afterLogin.logout);
router.post("/change_info_after_signup", afterLogin.changeInfoAfterSignup);

module.exports = router;
