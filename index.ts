"use strict";

const os = require("os");
const path = require("path");
const commandLineArgs = require("command-line-args");
const { stat } = require("fs/promises");
const { existsSync } = require("fs");
const startServer = require("./server/bin/www");
import { getStatOfDirectory } from "./utils/helpers/directory";
import { ArgV } from "./utils/types";
import { processBigInt } from "./utils/helpers/common";
import {
  optionDefinitions,
  handlePrintStatement,
} from "./utils/helpers/commandLine";

//const osName: string = os.platform();
const options = commandLineArgs(optionDefinitions);

handlePrintStatement(options);

if (options?.rootdir || options?.file) {
  const { rootdir: rawRootdir, file: rawFile, log, count, web }: ArgV = options;

  if (rawRootdir) {
    const rootdir = path.normalize(rawRootdir);
    if (!existsSync(rootdir)) {
      console.error("This path does not exist. Please try again.");
    } else {
      getStatOfDirectory(rootdir, 0, log, count).then((data) => {
        console.log({
          rootdir,
          ...data,
          size: processBigInt(data.size),
        });
        if (web) {
          startServer();
        }
      });
    }
  }

  if (rawFile) {
    const file = path.normalize(rawFile);
    if (!existsSync(file)) {
      console.error("This path does not exist. Please try again.");
    } else {
      stat(file).then((data) => {
        console.log({
          file,
          birthTime: data.birthtimeMs,
          lastModifiedTime: data.mtimeMs,
          size: processBigInt(data.size),
        });
        if (web) {
          startServer();
        }
      });
    }
  }
} else {
  console.error(
    "Error: Options must contain either a root directory path or file path."
  );
}
