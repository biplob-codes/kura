import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

const Layout = () => {
  return (
    <div className="flex bg-gray-50">
      <div className="">
        <Sidebar />
      </div>
      <div className="flex-1 p-2">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
