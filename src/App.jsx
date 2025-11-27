// react dependencies
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// user components
import Layouts from "./layouts/Layouts";
import SignUpPage from "./page/SignUpPage";
import SignInPage from "./page/SignInPage";
import Home from "./page/Home";
<<<<<<< HEAD
<<<<<<< Updated upstream
import Dashboard from "./page/Dashboard";
import Inbox from "./page/Inbox/Inbox";
=======
import Dashboard from "./page/dashboard/Dashboard";
import Inbox from "./page/Inbox/Inbox";
import Cardmessage from "./page/CardmessagePage/Cardmessage";
>>>>>>> Stashed changes
=======
import Dashboard from "./page/dashboard/Dashboard";
import Inbox from "./page/Inbox/Inbox";
import Setting from "./page/SettingPages/Setting";
import Notifiacation from "./page/notification/Notification";
import Log from "./page/Log";
import Member from "./page/Member";
import TokenReport from "./page/TokenReport";
import AllChat from "./page/allchat/Allchat";
>>>>>>> 3203e53a052d2190f12e80d4e375a38f287f1be8

// stylesheets
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  // ให้ไปเช็คใน localStorage ก่อนว่ามีของเก่าไหม
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("myAppUser");
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return null;
  });

  useEffect(() => {
    sessionStorage.removeItem("dashboardNotes");
  }, []);

  const handleLogin = (userFromForm) => {
    setCurrentUser(userFromForm);
    localStorage.setItem("myAppUser", JSON.stringify(userFromForm));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("myAppUser");
  };

<<<<<<< HEAD

                    <Route element={
                        // ส่ง currentUser เข้าไปเช็คสิทธิ์
                        <ProtectedRoute user={currentUser} allowedRoles={['admin', 'it', 'user',]}>
                            <Layouts onLogout={handleLogout} />
                        </ProtectedRoute>
                    }>

                        <Route path="/dashboard" element={<Dashboard user={currentUser} />} />
                        <Route path="/inbox" element={<Inbox />} />
                        <Route path="/setting" element={<Setting user={currentUser} />} />
<<<<<<< Updated upstream
                        <Route path="/privacy" element={<div>หน้า Privacy</div>} />
=======
                        <Route path="/log" element={<Log />} />
                        <Route path="/notification" element={<Notifiacation />} />
                        <Route path="/member" element={<Member />} />
                        <Route path="/cardmessage" element={<Cardmessage />} />


>>>>>>> Stashed changes
=======
  return (
    <div>
      <BrowserRouter>
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
>>>>>>> 3203e53a052d2190f12e80d4e375a38f287f1be8

          {/* --- Protected Routes --- */}
          <Route
            element={
              <ProtectedRoute
                user={currentUser}
                allowedRoles={["admin", "it", "user"]}
              >
                <Layouts onLogout={handleLogout} user={currentUser} />
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
            <Route path="/setting" element={<Setting user={currentUser} />} />
            <Route path="/log" element={<Log />} />
            <Route path="/notification" element={<Notifiacation />} />{" "}
            {/* เช็คชื่อตัวแปรดีๆนะครับ */}
            <Route path="/member" element={<Member />} />
            <Route path="/tokenreport" element={<TokenReport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
