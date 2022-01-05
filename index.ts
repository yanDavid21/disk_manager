"use strict";
const path = require("path");
const commandLineArgs = require("command-line-args");
const { existsSync } = require("fs");
const { startServer, updateDirectoryStruct } = require("./server/bin/www");
import { ArgV } from "./utils/types";
import {
  optionDefinitions,
  handlePrintStatement,
} from "./utils/helpers/commandLine";
import { exit } from "process";
import {
  getStatOfDirectory,
  getDirectoryNames,
} from "./utils/helpers/directory";

export const initNameTreeDepth = 3;

//get command line arguments
const options = commandLineArgs(optionDefinitions);
const { rootdir: rawRootdir, log, count, web }: ArgV = options;

//print help statement
handlePrintStatement(options);

//if directory is falsy, terminate
if (!options?.rootdir) {
  console.error("Error: Options must contain either a root directory path.");
  exit(1);
}

const pathName = path.normalize(rawRootdir);

if (!existsSync(pathName)) {
  console.error("This path does not exist. Please try again.");
  exit(1);
}

const accumalatorDirectoryDict = {};
const accumalatorNameDict = {};

if (web) {
  getDirectoryNames(pathName, "", initNameTreeDepth, accumalatorNameDict).then(
    () => {
      startServer(accumalatorNameDict, initNameTreeDepth, pathName);
      getStatOfDirectory(
        pathName,
        0,
        log,
        count,
        web,
        accumalatorDirectoryDict
      ).then(() => {
        updateDirectoryStruct(accumalatorDirectoryDict);
      });
    }
  );
} else {
  getStatOfDirectory(
    pathName,
    0,
    log,
    count,
    web,
    accumalatorDirectoryDict
  ).then(() => {
    const result = {
      directory: pathName,
      ...accumalatorDirectoryDict[pathName],
    };
    console.log(result);
  });
}
