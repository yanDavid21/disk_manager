"use strict";

import { Stats } from "fs";

const os = require("os");
const path = require("path");
const commandLineUsage = require("command-line-usage");
const commandLineArgs = require("command-line-args");
const { readdir, stat } = require("fs/promises");
const { existsSync } = require("fs");

const processBigInt = (bigint: bigint): string => {
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
    const sizeInKB = Number(bigint / BigInt(KB_size));
    return `${(sizeInKB / MB_size).toFixed(3)} GB`;
  }
};

interface DirectoryStat {
  size: bigint;
  numFiles: number;
  numDirs: number;
  birthTime?: number;
  lastModifiedTime?: number;
}

interface DirEnt {
  filename: string;
  fileStat: Stats;
}

interface Option {
  name: string;
  alias: string;
  type: Function;
  description: string;
  typeLabel?: string;
  defaultOption?: boolean;
}

interface ArgV {
  rootdir: string;
  file: string;
  log: boolean;
  count: boolean;
  help: boolean;
}

const getDirEnts = async (
  directoryPath: string,
  filenames: string[]
): Promise<DirEnt[]> => {
  const dirEntPromises: Promise<DirEnt>[] = filenames.map(
    async (filename: string) => {
      const fileStat: Stats = await stat(path.join(directoryPath, filename), {
        bigint: true,
      });
      return { filename, fileStat };
    }
  );

  return Promise.all(dirEntPromises);
};

const getListOfFileStats = (listOfDirEnts: DirEnt[]) => {
  const listOfFiles: DirEnt[] = listOfDirEnts.filter(({ fileStat }) => {
    return fileStat.isFile();
  });

  return listOfFiles.map(({ fileStat }) => {
    return fileStat;
  });
};

const getListOfDirStats = (
  listOfDirEnts: DirEnt[],
  directoryPath: string,
  depth: number,
  log: boolean,
  count: boolean
) => {
  const listOfDirectories: DirEnt[] = listOfDirEnts.filter(({ fileStat }) => {
    return fileStat.isDirectory();
  });

  const dirStatPromises: Promise<DirectoryStat>[] = listOfDirectories.map(
    ({ filename }) => {
      return getStatOfDirectory(
        path.join(directoryPath, filename),
        depth + 1,
        log,
        count
      );
    }
  );

  return Promise.all(dirStatPromises);
};

const getStatOfDirectory = async (
  directoryPath: string,
  depth: number,
  log: boolean,
  count: boolean
): Promise<DirectoryStat> => {
  if (log && depth < 3) {
    console.log(`Measuring ${directoryPath}...`);
  }

  try {
    const filenames: string[] = await readdir(directoryPath);
    const listOfDirEnts: DirEnt[] = await getDirEnts(directoryPath, filenames);

    const listOfFileStats: Stats[] = getListOfFileStats(listOfDirEnts);
    const listOfDirectoryStats: DirectoryStat[] = await getListOfDirStats(
      listOfDirEnts,
      directoryPath,
      depth,
      log,
      count
    );

    let directorySize = BigInt(0);

    listOfFileStats.forEach((stat) => {
      directorySize += BigInt(stat.size);
    });

    let numOfSubDirFiles = 0;
    let numOfSubDirectories = 0;
    listOfDirectoryStats.forEach((stat) => {
      directorySize += stat.size;
      if (count) {
        numOfSubDirFiles += stat.numFiles;
        numOfSubDirectories += stat.numDirs;
      }
    });

    const directoryStat: Stats = await stat(directoryPath, { bigint: true });
    const birthTime = directoryStat.birthtimeMs;
    const lastModifiedTime = directoryStat.mtimeMs;

    return {
      birthTime,
      lastModifiedTime,
      size: directorySize,
      numFiles: count ? listOfFileStats.length + numOfSubDirFiles : 0,
      numDirs: count ? listOfDirectoryStats.length + numOfSubDirectories : 0,
    };
  } catch (error) {
    if (depth === 0) {
      console.error("\nUnable to scan this directory due to OS permissions.");
    }
    return {
      size: BigInt(0),
      numFiles: 0,
      numDirs: 0,
    };
  }
};

const optionDefinitions: Option[] = [
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
    description:
      "Prints names of all directories analzyed (default depth of 3).",
  },
  {
    name: "count",
    alias: "c",
    type: Boolean,
    description: "Prints number of files and directories accounted for.",
  },
  {
    name: "help",
    alias: "h",
    type: Boolean,
    description: "Print this usage guide",
  },
];

const options = commandLineArgs(optionDefinitions);
const osName: string = os.platform();

if (options.help || Object.keys(options).length === 0) {
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

if (!options?.rootdir && !options?.file) {
  console.error(
    "Error: Options must contain either a root directory path or file path."
  );
} else {
  const { rootdir: rawRootdir, file: rawFile, log, count }: ArgV = options;

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
      });
    }
  }
}
