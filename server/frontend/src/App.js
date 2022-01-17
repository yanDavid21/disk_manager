import { useEffect, useState } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Grid } from "@mui/material";
import Paper from "@mui/material/Paper";

const BACKEND_URL = "http://localhost:8080/api/data";

const DirectoryStats = (selectedFolder) => {
  return (
    <>
      {Object.keys(selectedFolder.folder).map((key) => {
        return <p key={key}>{`${key}: ${selectedFolder.folder[key]}`}</p>;
      })}
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
  const [exploredFolders, setExploredFolders] = useState(new Set());
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
        console.log("error here2")
      });
  };

  const fetchDirectoryMap = () => {
    fetch(`${BACKEND_URL}/stat`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setDirectoryDict(data);
      })
      .catch((err) => {
        alert(err);
        console.log("error here");
      });
  };

  const convertStructToTreeItem = (nameStruct, directoryPath) => {
    const { name, subFolders } = nameStruct[directoryPath];

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
      >
        {subFolders.map((subFolder) =>
          convertStructToTreeItem(nameStruct, subFolder)
        )}
      </TreeItem>
    );
  };

  useEffect(fetchInitData, []);
  useEffect(fetchDirectoryMap, []);

  return (
    <Grid container className="App" spacing={2}>
      <Grid item xs={6}>
        <div>
          <TreeView
            aria-label="multi-select"
            defaultCollapseIcon={<ExpandMoreIcon />}
            defaultExpandIcon={<ChevronRightIcon />}
            onNodeSelect={(event, nodeId) => {
              setSelectedFolder(directoryDict[nodeId]);
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
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: "50vh",
              padding: "1em",
              top: "25%",
              position: "fixed",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            Folder Information
            <DirectoryStats folder={selectedFolder} />
          </Paper>
        </div>
      </Grid>
    </Grid>
  );
};

export default App;
