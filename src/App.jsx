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
import Notifiacation from "./page/notification/Notification"; // ถ้าชื่อไฟล์จริงคือ Notification แนะนำให้แก้ตัวแปรเป็น Notification ด้วยครับ
import Log from "./page/Log";
import Member from "./page/Member";
import TokenReport from "./page/TokenReport";


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

    const handleLogin = (userFromForm) => {
        setCurrentUser(userFromForm);
        localStorage.setItem("myAppUser", JSON.stringify(userFromForm));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem("myAppUser");
    };

    return (
        <div>
            <BrowserRouter>
                <Routes>
                    {/* --- Public --- */}
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/signup" element={<SignUpPage onLogin={handleLogin} />} />
                    <Route path="/signin" element={
                        currentUser ? <Navigate to="/dashboard" /> : <SignInPage onLogin={handleLogin} />
                    } />

                    {/* --- Protected Routes --- */}
                    <Route element={
                        <ProtectedRoute user={currentUser} allowedRoles={['admin', 'it', 'user',]}>
                            <Layouts onLogout={handleLogout} user={currentUser} />
                        </ProtectedRoute>
                    }>

                        <Route path="/dashboard" element={<Dashboard user={currentUser} />} />
                        <Route path="/inbox" element={<Inbox currentUser={currentUser} />} />
                        <Route path="/setting" element={<Setting user={currentUser} />} />
                        <Route path="/log" element={<Log />} />
                        <Route path="/notification" element={<Notifiacation />} /> {/* เช็คชื่อตัวแปรดีๆนะครับ */}
                        <Route path="/member" element={<Member />} />
                        <Route path="/tokenreport" element={<TokenReport />} />

                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;