import { Stats } from "fs";
const { readdir, stat } = require("fs/promises");
const path = require("path");
import { DirectoryStat, DirEnt } from "../types";
import { getListOfFileStats } from "./file";

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
      subFolders: web ? listOfDirectoryStats : [],
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
      subFolders: [],
    };
  }
};
