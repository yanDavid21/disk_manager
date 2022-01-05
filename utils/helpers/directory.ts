import { Stats } from "fs";
import { resolve } from "path/posix";
const { readdir, stat } = require("fs/promises");
const path = require("path");
import { DirectoryLabel, DirectoryStat, DirEnt } from "../types";
import { getListOfFileStats } from "./file";
const os = require("os");

const osName: string = os.platform();
const fileSeparator = osName === "win32" ? "\\" : "/";

const getDirEnts = async (
  directoryPath: string,
  filenames: string[]
): Promise<DirEnt[]> => {
  const dirEntPromises: Promise<DirEnt>[] = filenames.map(
    async (filename: string) => {
      const fileStat: Stats = await stat(path.join(directoryPath, filename), {
        bigint: false,
      });
      return { filename, fileStat };
    }
  );

  return Promise.all(dirEntPromises);
};

export const getStatOfDirectory = async (
  directoryPath: string,
  depth: number,
  log: boolean,
  count: boolean,
  web: boolean,
  accumalatorDict: Record<string, DirectoryStat>
): Promise<void> => {
  if (log && depth < 3) {
    console.log(`Measuring ${directoryPath}...`);
  }

  try {
    const filenames: string[] = await readdir(directoryPath);
    const listOfDirEnts: DirEnt[] = await getDirEnts(directoryPath, filenames);

    const listOfFileStats: Stats[] = getListOfFileStats(listOfDirEnts);
    const listOfDirectories: DirEnt[] = listOfDirEnts.filter(({ fileStat }) => {
      return fileStat.isDirectory();
    });

    await Promise.all(
      listOfDirectories.map((dir: DirEnt) => {
        return getStatOfDirectory(
          path.join(directoryPath, dir.filename),
          depth + 1,
          log,
          count,
          web,
          accumalatorDict
        );
      })
    );

    let directorySize = 0;

    listOfFileStats.forEach((stat) => {
      directorySize += stat.size;
    });

    let numOfSubDirFiles = 0;
    let numOfSubDirectories = 0;
    listOfDirectories.forEach((dir: DirEnt) => {
      const dirStat = accumalatorDict[path.join(directoryPath, dir.filename)];
      directorySize += dirStat.size;
      if (count) {
        numOfSubDirFiles += dirStat.numFiles;
        numOfSubDirectories += dirStat.numDirs;
      }
    });

    const directoryStat: Stats = await stat(directoryPath, { bigint: false });
    const birthTime = directoryStat.birthtimeMs;
    const lastModifiedTime = directoryStat.mtimeMs;

    accumalatorDict[directoryPath] = {
      birthTime,
      lastModifiedTime,
      size: directorySize,
      numFiles: count ? listOfFileStats.length + numOfSubDirFiles : 0,
      numDirs: count ? listOfDirectories.length + numOfSubDirectories : 0,
    };
  } catch (error) {
    if (depth === 0) {
      console.error(error);
      console.error("\nUnable to scan this directory due to OS permissions.");
    }
    accumalatorDict[directoryPath] = { size: 0, numFiles: 0, numDirs: 0 };
  }
};

export const getDirectoryNames = async (
  parentPath: string,
  directoryName: string,
  depth: number,
  accumalator: Record<string, DirectoryLabel>
): Promise<void> => {
  const directoryPath = path.join(parentPath, directoryName);

  let index = directoryPath.lastIndexOf(fileSeparator);
  if (index === directoryPath.length - 1) {
    index = directoryPath.lastIndexOf(fileSeparator, index - 1);
  }
  const dirName =
    index > -1 ? directoryPath.substring(index + 1) : directoryPath;

  //provides a leaf node for lazy loading
  if (depth === 1) {
    accumalator[directoryPath] = {
      name: dirName,
      subFolders: [],
    };
    return;
  }

  const filenames: string[] = await readdir(directoryPath);
  const listOfDirEnts: DirEnt[] = await getDirEnts(directoryPath, filenames);
  const listOfSubDirectories: DirEnt[] = listOfDirEnts.filter(
    ({ fileStat }) => {
      return fileStat.isDirectory();
    }
  );
  const namesOfSubDirectories: string[] = listOfSubDirectories.map(
    ({ filename }) => {
      return filename;
    }
  );
  await Promise.all(
    //recursive call
    namesOfSubDirectories.map((name) =>
      getDirectoryNames(directoryPath, name, depth - 1, accumalator)
    )
  );

  accumalator[directoryPath] = {
    name: dirName,
    subFolders: namesOfSubDirectories.map((name) =>
      path.join(directoryPath, name)
    ),
  };
};
