import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Transfer from "./pages/Transfer";
import Video from "./pages/Video";
import Folders from "./pages/Folders";
import FolderVideos from "./pages/FolderVideos";
import Watched from "./pages/Watched";
import Watchlist from "./components/Watchlist";
import Archive from "./pages/Archive";

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
        path: "/watchlist",
        element: <Watchlist />,
      },
      {
        path: "/watched",
        element: <Watched />,
      },
      {
        path: "/archive",
        element: <Archive />,
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
