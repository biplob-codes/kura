import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Transfer from "./pages/Transfer";
import Video from "./pages/Video";
import Folders from "./pages/Folders";
import FolderVideos from "./pages/FolderVideos";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/folders",
        element: <Folders />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/folders/:folderId",
        element: <FolderVideos />,
      },
      {
        path: "/transfer",
        element: <Transfer />,
      },
      {
        path: "/videos/:videoId",
        element: <Video />,
      },
    ],
  },
]);
