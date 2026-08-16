import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import CategoryDetails from "./pages/CategoryDetails";
import Transfer from "./pages/Transfer";
import Video from "./pages/Video";
import Folders from "./pages/Folders";

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
        path: "/folders/:categoryPath",
        element: <CategoryDetails />,
      },
      {
        path: "/transfer",
        element: <Transfer />,
      },
      {
        path: "/videos/:videoPath",
        element: <Video />,
      },
    ],
  },
]);
