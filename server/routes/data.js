const express = require("express");
const router = express.Router();
const { getDirectoryNames } = require("../../utils/helpers/directory");

router.get("/", function (req, res, next) {
  res.status(200).json({
    initNameTreeDepth: req.app.locals.initNameTreeDepth,
    nameStruct: req.app.locals.nameStruct,
    rootDir: req.app.locals.rootDir,
  });
});

router.get("/stat", function (req, res, next) {
  res.status(200).json(req.app.locals.directoryStruct);
});

router.get("/names/:path", function (req, res, next) {
  //get dir path from params,
  const { path } = req.params;
  const decodedPath = path.replaceAll("%5C", "\\").replaceAll("%2F", "/");
  getDirectoryNames(decodedPath, "", 3, req.app.locals.nameStruct).then(() => {
    res.status(200).json(req.app.locals.nameStruct);
  });
});

module.exports = router;
