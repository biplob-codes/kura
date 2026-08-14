import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import CategoryDetails from "./pages/CategoryDetails";
import Transfer from "./pages/Transfer";
import Video from "./pages/Video";

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
        path: "/categories",
        element: <Categories />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/categories/:categoryPath",
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
