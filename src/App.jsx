// react dependencies
import { BrowserRouter, Routes, Route } from "react-router-dom";

// user components
import Layouts from "./layouts/Layouts";
import SignUpPage from "./page/SignUpPage";
import SignInPage from "./page/SignInPage";
import Home from "./page/Home";
import Dashboard from "./page/Dashboard";
import Inbox from "./page/Inbox/Inbox";

// stylesheets
import "./App.css";
import Setting from "./page/SettingPages/Setting";

// react function component
function App() {
  // render
  return (
    <div>
      <BrowserRouter >
        <Routes>
          {/* ตั้งค่า Route หลักให้ไปที่หน้า Home */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/home" element={<Home />} />
          <Route element={<Layouts />}>
            {/* สร้าง Route สำหรับ Link อื่นๆ ที่เราสร้างไว้ */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/setting" element={<Setting/>} />
            <Route path="/privacy" element={<div>หน้า Privacy</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
