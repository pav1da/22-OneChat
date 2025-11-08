import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";

const Layouts = () => {
  return (
    <div className="d-flex min-vh-100">
      <aside className="position-fixed vh-100">
        <Sidebar />
      </aside>
      <div className="flex-grow-1 ps-5 p-4" style={{ marginLeft: '200px' }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layouts;
