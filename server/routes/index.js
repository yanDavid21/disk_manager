const express = require("express");
const router = express.Router();
const path = require("path");

/* GET home page. */
router.get("/", function (req, res, next) {
  console.log(path.join(__dirname, "..", "frontend", "build"));
  res.sendFile("index.html", {
    root: path.join(__dirname, "..", "frontend", "build"),
  });
});

module.exports = router;
