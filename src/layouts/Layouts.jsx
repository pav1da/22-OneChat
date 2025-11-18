import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";

const Layouts = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="d-flex min-vh-100">
      <aside className="position-fixed vh-100">
        <Sidebar
          collapsed={collapsed}
          toggleSidebar={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* ย่อ-ขยาย ขยับตาม sidebar */}
      <div
        className="flex-grow-1 p-4"
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
