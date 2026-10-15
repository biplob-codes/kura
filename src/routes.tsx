import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Transfer from "./pages/Transfer";
import Video from "./pages/Video";
import Folders from "./pages/Folders";
import FolderVideos from "./pages/FolderVideos";
import Models from "./pages/Models";
import Watched from "./pages/Watched";
import Playlist from "./pages/Playlist";
import Archive from "./pages/Archive";
import ModelVideos from "./pages/ModelVideos";
import PlaylistVideos from "./pages/PlaylistVideos";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "/folders", element: <Folders /> },
      { path: "/folders/:folderId", element: <FolderVideos /> },
      { path: "/models", element: <Models /> },
      { path: "/playlists", element: <Playlist /> },
      { path: "/playlists/:playlistId", element: <PlaylistVideos /> },
      { path: "/watched", element: <Watched /> },
      { path: "/archive", element: <Archive /> },
      { path: "/transfer", element: <Transfer /> },
      { path: "/settings", element: <Settings /> },
      { path: "/videos/:videoId", element: <Video /> },
      { path: "/models/:modelId", element: <ModelVideos /> },
    ],
  },
]);
