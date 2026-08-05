import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";

function App() {
  const [files, setFiles] = useState<string[]>();
  const [err, setErr] = useState("")
  async function listFiles() {
    invoke<string[]>("list_files").then(f => setFiles(f)).catch(e => setErr(e))
  }

  return (
    <main className="container">
      <h1>Welcome to Kura</h1>
      <button onClick={listFiles}>List files</button>
      {err && <p>err</p>}
      {files?.map(f => <p key={f}>{f}</p>)}
    </main>
  );
}

export default App;
