import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatFileSize } from "../utils/files";
interface File {
  name: string;
  path: string;
  size: number;
}
const CategoryDetails = () => {
  const { categoryPath } = useParams();
  if (!categoryPath) return <p>No path provided for category.</p>;
  const path = decodeURIComponent(categoryPath);
  const [files, setFiles] = useState<File[]>();
  useEffect(() => {
    invoke<File[]>("list_files", { path }).then((res) => setFiles(res));
  }, []);
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <p>Received path: {path}</p>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 my-5">
        {files?.map((f) => (
          <li
            key={f.path}
            className="flex items-center justify-between px-4 py-2 text-sm"
          >
            <span className="truncate">
              <Link to={`/videos/${encodeURIComponent(f.path)}`}>{f.name}</Link>
            </span>
            <span className="shrink-0 text-gray-500">
              {formatFileSize(f.size)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryDetails;
