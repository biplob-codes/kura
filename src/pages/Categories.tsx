import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Folder {
  name: string;
  path: string;
}
const Categories = () => {
  const [folders, setFolders] = useState<Folder[]>();
  useEffect(() => {
    invoke<Folder[]>("list_folders", { dir: "library" }).then((res) =>
      setFolders(res),
    );
  }, []);
  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {folders?.map((f) => (
          <Link key={f.path} to={`/categories/${encodeURIComponent(f.path)}`}>
            <div
              key={f.path}
              className="p-5 border hover:bg-gray-200 cursor-pointer border-gray-300 rounded-md "
            >
              <p>{f.name}</p>
              <p>{f.path}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Categories;
