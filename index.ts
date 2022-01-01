"use strict";
//const os = require("os");
//const osName: string = os.platform();

const path = require("path");
const commandLineArgs = require("command-line-args");
import { ArgV, DirectoryStat } from "./utils/types";
import { processBigInt } from "./utils/helpers/common";
import {
  optionDefinitions,
  handlePrintStatement,
} from "./utils/helpers/commandLine";
import { exit } from "process";
const { existsSync } = require("fs");
const startServer = require("./server/bin/www");
import { getStatOfDirectory } from "./utils/helpers/directory";

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

getStatOfDirectory(pathName, 0, log, count).then((dstat: DirectoryStat) => {
  const result = {
    directory: pathName,
    ...dstat,
    size: processBigInt(dstat.size),
  };
  console.log(result);
  web && startServer(result);
});
