// react dependencies
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// user components
import Layouts from "./layouts/Layouts";
import SignUpPage from "./page/SignUpPage";
import SignInPage from "./page/SignInPage";
import Home from "./page/Home";
import Dashboard from "./page/dashboard/Dashboard";
import Inbox from "./page/Inbox/Inbox";
import Setting from "./page/SettingPages/Setting";
import Notifiacation from "./page/notification/Notification";
import Log from "./page/Log";
import Member from "./page/member/Member";
import TokenReport from "./page/TokenReport";
import AllChat from "./page/allchat/Allchat";
import CardMessage from "./page/CardmessagePage/Cardmessage";
import { ChatProvider } from "./context/ChatContext";
import { TeamProvider } from "./context/TeamContext";

// stylesheets
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // ให้ไปเช็คใน localStorage ก่อนว่ามีของเก่าไหม
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("myAppUser");
    const token = localStorage.getItem("token");
    if (savedUser && token) {
      const parsed = JSON.parse(savedUser);
      // ตรวจสอบว่า role ตรงกับ DB roles หรือไม่
      const validRoles = ["admin", "manager", "staff"];
      if (parsed.role && validRoles.includes(parsed.role)) {
        return parsed;
      }
      // ถ้า role ไม่ valid (จาก mock data เก่า) ให้ล้างออก
      localStorage.removeItem("myAppUser");
      localStorage.removeItem("token");
    }
    return null;
  });

  useEffect(() => {
    sessionStorage.removeItem("dashboardNotes");
  }, []);

  const handleLogin = (userFromForm) => {
    setCurrentUser(userFromForm);
    localStorage.setItem("myAppUser", JSON.stringify(userFromForm));
    // token จะถูกเก็บจาก SignInPage/SignUpPage โดยตรง
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("myAppUser");
    localStorage.removeItem("token");
  };

  return (
    <div>
      <BrowserRouter basename="/onechat/">
        <Routes>
          {/* --- Public --- */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route
            path="/signup"
            element={<SignUpPage onLogin={handleLogin} />}
          />
          <Route
            path="/signin"
            element={
              currentUser ? (
                <Navigate to="/dashboard" />
              ) : (
                <SignInPage onLogin={handleLogin} />
              )
            }
          />

          {/* --- Protected Routes --- */}
          <Route
            element={
              <ProtectedRoute
                user={currentUser}
                allowedRoles={["admin", "manager", "staff"]}
              >
                <TeamProvider currentUser={currentUser}>
                  <ChatProvider>
                    <Layouts onLogout={handleLogout} user={currentUser} />
                  </ChatProvider>
                </TeamProvider>
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={<Dashboard user={currentUser} />}
            />
            <Route
              path="/allchat"
              element={<AllChat currentUser={currentUser} />}
            />

            <Route
              path="/inbox"
              element={<Inbox currentUser={currentUser} />}
            />

            <Route
              path="/cardmessage"
              element={<CardMessage currentUser={currentUser} />}
            />

            <Route path="/log" element={<Log />} />
            <Route path="/notification" element={<Notifiacation />} />
            <Route path="/member" element={<Member />} />
            <Route path="/tokenreport" element={<TokenReport />} />
            <Route path="/setting" element={<Setting user={currentUser} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
