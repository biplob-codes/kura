import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";

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
          <div
            key={f.path}
            className="p-5 border  border-bg-gray-100 rounded-md "
          >
            <p>{f.name}</p>
            <p>{f.path}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
