import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="">
        <Sidebar />
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-200">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
