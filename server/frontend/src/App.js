import { useEffect, useState } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { CircularProgress, Grid, Typography } from "@mui/material";
import Paper from "@mui/material/Paper";

const BACKEND_URL = "http://localhost:8080/api/data";

const getSizeWithSuffix = (size) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)}KB`;
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)}MB`;
  } else if (size < 1024 * 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)}GB`;
  }
};

const getInterpolatedColoringFromSize = (min, max, size) => {
  const percentTowardsRed = (size - min) / (max - min);
  const redValue = percentTowardsRed * 255;

  return `rgb(${redValue}, 0, ${255 - redValue})`;
};

const getNameStructWithColors = (nameStruct, directoryStruct, rootDir) => {
  if (!(nameStruct && directoryStruct && rootDir)) {
    return nameStruct;
  }

  const nameStructWithColors = { [rootDir]: nameStruct[rootDir] };
  console.log("test");
  console.log(nameStructWithColors);
  addChildrenNameStructWithColors(
    nameStructWithColors,
    nameStruct,
    nameStruct[rootDir],
    directoryStruct
  );
};

const addChildrenNameStructWithColors = (
  newNameStruct,
  oldNameStruct,
  parentDir,
  directoryStruct
) => {
  const childrenFolderSizes = parentDir.subFolders.map(
    (subFolder) => directoryStruct[subFolder]
  );
  const min = Math.min(...childrenFolderSizes);
  const max = Math.max(...childrenFolderSizes);

  parentDir.subFolders.forEach((subFolder) => {
    newNameStruct[subFolder] = {
      ...oldNameStruct[subFolder],
      backgroundColor: getInterpolatedColoringFromSize(
        min,
        max,
        directoryStruct[subFolder].size
      ),
    };
    addChildrenNameStructWithColors(
      newNameStruct,
      oldNameStruct,
      oldNameStruct[subFolder],
      directoryStruct
    );
  });
};

const DirectoryStats = (selectedFolder) => {
  const folder = selectedFolder.folder;
  return (
    <>
      <p>{`Created on: ${new Date(folder.birthTime).toLocaleString()}`}</p>
      <p>{`Last modified on: ${new Date(
        folder.lastModifiedTime
      ).toLocaleString()}`}</p>
      <p>{`Size: ${getSizeWithSuffix(folder.size)}`}</p>
      <p>{`Number of files: ${folder.numFiles}`}</p>
      <p>{`Number of subdirectories: ${folder.numDirs}`}</p>
    </>
  );
};

const initState = {
  birthTime: 0,
  lastModifiedTime: 0,
  size: 0,
  numFiles: 0,
  numDirs: 0,
};

const App = () => {
  const [rootDir, setRootDir] = useState(null); //root directory
  const [selectedFolder, setSelectedFolder] = useState(initState); //current selected folder
  const [directoryDict, setDirectoryDict] = useState({}); //dictionary mapping folder name to folder stats
  const [nameStruct, setNameStruct] = useState(null); //nested tree structure representing the relationship between folders (stores folder names)
  const [exploredFolders, setExploredFolders] = useState(new Set()); //tracks which folders have been opened aka. its data has been fetched
  const [loading, setLoading] = useState(true); // loading state
  const [folderName, setFolderName] = useState(null); //selected folder name to be displayed

  const fetchInitData = () => {
    fetch(BACKEND_URL)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setRootDir(data.rootDir);
        setNameStruct(data.nameStruct);
        setExploredFolders(new Set([data.rootDir]));
      })
      .catch((err) => {
        alert(err);
        console.log("error here2");
      });
  };

  // set up socket connection, data will be pushed when done calculating
  const initSocketConnection = () => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onopen = (event) => {
      setLoading(true);
    };
    ws.onmessage = (event) => {
      if (event.data === "DATA READY") {
        fetch(`${BACKEND_URL}/stat`)
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            console.log(data);
            setDirectoryDict(data);
            setLoading(false);
          })
          .catch((err) => {
            alert(err);
            console.log("error here");
          });
      }
    };
    //clean up function
    return () => ws.close();
  };

  useEffect(fetchInitData, []);
  useEffect(initSocketConnection, []);
  useEffect(() => {
    if (loading === false) {
      setSelectedFolder(directoryDict[rootDir]);
    }
  }, [loading, directoryDict, rootDir]);
  // useEffect(() => {
  //   setNameStruct(getNameStructWithColors(nameStruct, directoryDict, rootDir));
  // }, [directoryDict, nameStruct, rootDir]);

  const convertStructToTreeItem = (nameStruct, directoryPath) => {
    const { name, subFolders, backgroundColor } = nameStruct[directoryPath];

    //if the current folder has never been expanded, when clicked for the first time,
    const fetchNewNames = () => {
      if (!exploredFolders.has(name)) {
        fetch(
          `${BACKEND_URL}/names/${directoryPath
            .replaceAll("\\", "%5C")
            .replaceAll("/", "%2F")}`
        )
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            setNameStruct(data);
            setExploredFolders(new Set([...Array.from(exploredFolders), name]));
          })
          .catch((err) => {
            alert(err);
          });
      }
    };

    return (
      <TreeItem
        label={name}
        nodeId={directoryPath}
        key={directoryPath}
        onClick={fetchNewNames}
        sx={{
          backgroundColor: backgroundColor ?? "#FFFFFF",
          color: backgroundColor ? "white" : "black",
        }}
      >
        {subFolders.map((subFolder) =>
          convertStructToTreeItem(nameStruct, subFolder)
        )}
      </TreeItem>
    );
  };

  return (
    <Grid container className="App" spacing={2} sx={{ padding: 20 }}>
      <Grid item xs={6}>
        <div>
          <TreeView
            aria-label="multi-select"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            onNodeSelect={(event, nodeId) => {
              setSelectedFolder(directoryDict[nodeId]);
              const withoutEndSlash = nodeId.substring(0, nodeId.length - 1);
              const rootFolderRelPath = nodeId.substring(
                withoutEndSlash.lastIndexOf("\\") + 1
              );
              const relFolderPath = nodeId.substring(
                nodeId.lastIndexOf("\\") + 1
              );

              if (folderName) {
                setFolderName(
                  nodeId === rootDir ? rootFolderRelPath : relFolderPath
                );
              } else {
                setFolderName(rootFolderRelPath);
              }
            }}
          >
            {nameStruct && convertStructToTreeItem(nameStruct, rootDir)}
          </TreeView>
        </div>
      </Grid>
      <Grid item xs={6}>
        <div
          style={{
            height: "100vh",
            width: "100%",
            padding: "2em",
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              padding: "1em",
              boxSizing: "border-box",
            }}
          >
            <Typography variant="h4">
              {folderName ?? `Folder Information`}
            </Typography>
            {loading ? (
              <CircularProgress />
            ) : (
              <DirectoryStats folder={selectedFolder} />
            )}
          </Paper>
        </div>
      </Grid>
    </Grid>
  );
};

export default App;
