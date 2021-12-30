"use strict";
const path = require("path");
const commandLineUsage = require("command-line-usage");
const commandLineArgs = require("command-line-args");
const os = require("os");
const { readdir, stat } = require("fs/promises");

const processBigInt = (bigint) => {
  const KB_size = 1024;
  const MB_size = KB_size * 1024;
  const GB_size = MB_size * 1024;
  if (bigint < BigInt(KB_size)) {
    return `${bigint} bytes`;
  } else if (bigint < BigInt(MB_size)) {
    return `${(Number(bigint) / KB_size).toFixed(3)} KB`;
  } else if (bigint < BigInt(GB_size)) {
    return `${(Number(bigint) / MB_size).toFixed(3)} MB`;
  } else {
    console.log(Number(bigint) / 1024 / 1024);
    const sizeInKB = Number(bigint / BigInt(KB_size));
    return `${(sizeInKB / MB_size).toFixed(3)} GB`;
  }
};

const statOfDirectory = async (directoryPath, depth, log) => {
  if (log && depth < 3) {
    console.log(`Measuring ${directoryPath}...`);
  }
  const directoryStat = await stat(directoryPath, { bigint: true });
  const birthTime = directoryStat.birthtimeMs;
  const lastModifiedTime = directoryStat.mtimeMs;
  const filenames = await readdir(directoryPath);

  const listOfDirEnts = await Promise.all(
    filenames.map(async (filename) => {
      const fileStat = await stat(path.join(directoryPath, filename), {
        bigint: true,
      });
      return { filename, fileStat };
    })
  );

  const listOfFiles = listOfDirEnts.filter(({ fileStat }) => {
    return fileStat.isFile();
  });

  const listOfFileStats = listOfFiles.map(({ fileStat }) => {
    return fileStat;
  });

  const listOfDirectories = listOfDirEnts.filter(({ fileStat }) => {
    return fileStat.isDirectory();
  });

  const listOfDirectoryStats = await Promise.all(
    listOfDirectories.map(({ filename, fileStat }) => {
      return statOfDirectory(
        path.join(directoryPath, filename),
        depth + 1,
        log
      );
    })
  );

  let directorySize = BigInt(0);

  listOfFileStats.forEach((stat) => {
    directorySize += stat.size;
  });

  let numOfSubDirFiles = 0;
  let numOfSubDirectories = 0;
  listOfDirectoryStats.forEach((stat) => {
    directorySize += stat.size;
    numOfSubDirFiles += stat.numFiles;
    numOfSubDirectories += stat.numDirs;
  });

  return {
    birthTime,
    lastModifiedTime,
    size: directorySize,
    numFiles: listOfFileStats.length + numOfSubDirFiles,
    numDirs: listOfDirectoryStats.length + numOfSubDirectories,
  };
};

const optionDefinitions = [
  {
    name: "rootdir",
    alias: "d",
    type: String,
    defaultOption: true,
    typeLabel: "{underline filepath}",
    description: "Directory path to start recursive lookup on disk usage.",
  },
  {
    name: "file",
    alias: "f",
    type: String,
    typeLabel: "{underline filepath}",
    description: "File path for file meta data lookup.",
  },
  {
    name: "log",
    alias: "l",
    type: Boolean,
    description: "Prints names of all directories analzyed.",
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this usage guide",
  },
];

const options = commandLineArgs(optionDefinitions);
const osName = os.platform();

if (
  (options === null || options === void 0 ? void 0 : options.help) ||
  Object.keys(options).length === 0
) {
  const sections = [
    {
      header: "Disk Manager",
      content: "Manage and visualize your disk usage.",
    },
    {
      header: "Options",
      optionList: optionDefinitions.map((option) => {
        return {
          name: option.name,
          typeLabel:
            option === null || option === void 0 ? void 0 : option.typeLabel,
          description: option.description,
        };
      }),
    },
  ];
  const usage = commandLineUsage(sections);
  console.log(usage);
}
if (osName === "win32") {
  //path logic
}
if (
  !(options === null || options === void 0 ? void 0 : options.file) &&
  !(options === null || options === void 0 ? void 0 : options.rootdir)
) {
  console.error(
    "Error: Options must contain either a root directory path or file path."
  );
} else {
  const { rootdir: rawRootdir, file: rawFile, log } = options;

  if (rawRootdir) {
    const rootdir = path.normalize(rawRootdir);
    statOfDirectory(rootdir, 0, log).then((data) => {
      console.log({
        rootdir,
        ...data,
        size: processBigInt(data.size),
      });
    });
  }

  if (rawFile) {
    const file = path.normalize(rawFile);
    stat(file).then((data) => {
      console.log({
        file,
        birthTime: data.birthtimeMs,
        lastModifiedTime: data.mtimeMs,
        size: processBigInt(data.size),
      });
    });
  }
}
