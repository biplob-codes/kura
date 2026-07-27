import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import "./App.css";

function App() {
  const [emailAddress, setEmailAddress] = useState("");
  const [name, setName] = useState("");

  async function createEmail() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setEmailAddress(await invoke("create_email", { name }));
  }

  return (
    <main className="container">
      <h1>Welcome to Kura</h1>

      <h2>Write your name to create your email address</h2>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          createEmail();
        }}
      >
        <input
          id="create-email-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Create</button>
      </form>
      <p>{emailAddress}</p>
    </main>
  );
}

export default App;
