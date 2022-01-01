const express = require("express");
const router = express.Router();

router.get("/", function (req, res, next) {
  const { size, numFiles, numDirs } = req.app.get("data");
  console.log({ size, numFiles, numDirs });
  res.json({ size, files: numFiles, folders: numDirs });
});

module.exports = router;
