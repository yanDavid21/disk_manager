import { useEffect, useState } from "react";
import TreeView from "@mui/lab/TreeView";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TreeItem from "@mui/lab/TreeItem";
import { Grid } from "@mui/material";
import Paper from "@mui/material/Paper";

const initState = {
  birthTime: 0,
  lastModifiedTime: 0,
  size: 0,
  numFiles: 0,
  numDirs: 0,
};

const DirectoryStats = (selectedFolder) => {
  return (
    <>
      {Object.keys(selectedFolder.folder).map((key) => {
        return <p key={key}>{`${key}: ${selectedFolder.folder[key]}`}</p>;
      })}
    </>
  );
};

const BACKEND_URL = "http://localhost:8080/api/data";

const App = () => {
  const [directoryDict, setDirectoryDict] = useState({});
  const [nameStruct, setNameStruct] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(initState);
  const [rootDir, setRootDir] = useState(null);

  const fetchInitData = () => {
    fetch(BACKEND_URL)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setRootDir(data.rootDir);
        setNameStruct(data.nameStruct);
      })
      .catch((err) => {
        alert(err);
      });
  };
  const fetchDirectoryMap = () => {
    fetch(`${BACKEND_URL}/stat`)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        setDirectoryDict(data);
      })
      .catch((err) => {
        alert(err);
      });
  };

  const convertStructToTree = (nameStruct, directoryPath) => {
    const { name, subFolders } = nameStruct[directoryPath];
    const fetchNewNames = () => {
      if (subFolders.length === 0) {
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
          convertStructToTree(nameStruct, subFolder)
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
            {nameStruct && convertStructToTree(nameStruct, rootDir)}
          </TreeView>
        </div>
      </Grid>
      <Grid item xs={6}>
        <div style={{ padding: "2em", height: "100vh" }}>
          <Paper variant="outlined" sx={{ height: "50vh", padding: 1 }}>
            Folder Information
            <DirectoryStats folder={selectedFolder} />
          </Paper>
        </div>
      </Grid>
    </Grid>
  );
};

export default App;
