import "./App.css";
import { useEffect, useState } from "react";

const initState = {
  size: 0,
  numFiles: 0,
  numDirs: 0,
  subFolders: [],
  birthTime: undefined,
  lastModifiedTime: undefined,
};

const BACKEND_URL = "http://localhost:8080/api/data";

function App() {
  const [dirStructs, setDirStructs] = useState(initState);
  console.log(JSON.stringify(dirStructs));
  useEffect(() => {
    fetch(BACKEND_URL)
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        console.log(data);
        setDirStructs(data);
      })
      .catch((err) => {
        alert(err);
      });
  }, []);
  return (
    <div className="App">
      <p>{JSON.stringify(dirStructs)}</p>
    </div>
  );
}

export default App;
