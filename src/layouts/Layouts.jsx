import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";

const Layouts = () => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
      setCollapsed(!collapsed);
    };

  return (
    <div className="d-flex min-vh-100">
      <aside className="position-fixed vh-100">
        <Sidebar
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
        />
      </aside>

      {/* ย่อ-ขยาย ขยับตาม sidebar */}
      <div
        className="flex-grow-1 p-3"
        style={{
          marginLeft: collapsed ? "70px" : "220px",
          transition: "margin-left 0.25s ease"
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default Layouts;
