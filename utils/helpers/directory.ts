import { Stats } from "fs";
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

const getListOfDirStats = (
  listOfDirEnts: DirEnt[],
  directoryPath: string,
  depth: number,
  log: boolean,
  count: boolean,
  web: boolean
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
        count,
        web
      );
    }
  );

  return Promise.all(dirStatPromises);
};

export const getStatOfDirectory = async (
  directoryPath: string,
  depth: number,
  log: boolean,
  count: boolean,
  web: boolean
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
      count,
      web
    );

    let directorySize = 0;

    listOfFileStats.forEach((stat) => {
      directorySize += stat.size;
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

    const directoryStat: Stats = await stat(directoryPath, { bigint: false });
    const birthTime = directoryStat.birthtimeMs;
    const lastModifiedTime = directoryStat.mtimeMs;

    return {
      birthTime,
      lastModifiedTime,
      size: directorySize,
      subFolders: web ? listOfDirectoryStats : [],
      numFiles: count ? listOfFileStats.length + numOfSubDirFiles : 0,
      numDirs: count ? listOfDirectoryStats.length + numOfSubDirectories : 0,
    };
  } catch (error) {
    if (depth === 0) {
      console.error("\nUnable to scan this directory due to OS permissions.");
    }
    return {
      size: 0,
      numFiles: 0,
      numDirs: 0,
      subFolders: [],
    };
  }
};

export const getDirectoryNames = async (
  parentPath: string,
  directoryName: string,
  depth: number
): Promise<DirectoryLabel> => {
  const directoryPath = path.join(parentPath, directoryName);

  let index = directoryPath.lastIndexOf(fileSeparator);
  if (index === directoryPath.length - 1) {
    index = directoryPath.lastIndexOf(fileSeparator, index - 1);
  }
  const dirName =
    index > -1 ? directoryPath.substring(index + 1) : directoryPath;

  //provides a leaf node for lazy loading
  if (depth === 0) {
    return {
      name: dirName,
      subFolders: [],
    };
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

  return {
    name: dirName,
    subFolders: await Promise.all( //recursive call
      namesOfSubDirectories.map((name) =>
        getDirectoryNames(directoryPath, name, depth - 1)
      )
    ), 
  };
};
