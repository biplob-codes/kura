import { useEffect, useState } from "react";

const Home = () => {
  const [health, setHealth] = useState<string>();
  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((r) => r.text())
      .then((data) => setHealth(data));
  }, []);
  return (
    <div>
      This is the homepage
      <p>Status: {health}....</p>
    </div>
  );
};

export default Home;
