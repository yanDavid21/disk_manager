const express = require("express");
const router = express.Router();

router.get("/", function (req, res, next) {
  res.status(200).json(req.app.locals.directoryStruct);
});

module.exports = router;
