import { Stats } from "fs";

export interface DirectoryStat {
  size: bigint;
  numFiles: number;
  numDirs: number;
  subFolders: DirectoryStat[];
  birthTime?: number;
  lastModifiedTime?: number;
}

export interface DirEnt {
  filename: string;
  fileStat: Stats;
}

export interface Option {
  name: string;
  alias: string;
  type: Function;
  description: string;
  typeLabel?: string;
  defaultOption?: boolean;
}

export interface ArgV {
  rootdir: string;
  log: boolean;
  count: boolean;
  help: boolean;
  web: boolean;
}
