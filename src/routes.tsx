import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import Categories from "./pages/Categories";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                index: true,
                element: <Home />
            },
            {
                path: '/categories',
                element: <Categories />
            }
        ]
    },

])