import { DirEnt } from "../types";

export const getListOfFileStats = (listOfDirEnts: DirEnt[]) => {
  const listOfFiles: DirEnt[] = listOfDirEnts.filter(({ fileStat }) => {
    return fileStat.isFile();
  });

  return listOfFiles.map(({ fileStat }) => {
    return fileStat;
  });
};
