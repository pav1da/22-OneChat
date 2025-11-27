// react dependencies
import { useState, useEffect } from "react"; // เพิ่ม useEffect
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// user components
import Layouts from "./layouts/Layouts";
import SignUpPage from "./page/SignUpPage";
import SignInPage from "./page/SignInPage";
import Home from "./page/Home";
import Dashboard from "./page/dashboard/Dashboard";
import Inbox from "./page/Inbox/Inbox"; 

// stylesheets
import "./App.css";
import Setting from "./page/SettingPages/Setting";
import ProtectedRoute from "./components/ProtectedRoute";
import Notifiacation from "./page/notification/Notification";
import Log from "./page/Log";
import Member from "./page/Member";

function App() {
    // ให้ไปเช็คใน localStorage ก่อนว่ามีของเก่าไหม
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = localStorage.getItem("myAppUser");
        if (savedUser) {
            return JSON.parse(savedUser); // ถ้ามี ให้เอามาใช้เลย
        }
        return null; // ถ้าไม่มีก็เป็น null
    });

    // Login: นอกจาก set State แล้วให้บันทึกลงเครื่อง
    const handleLogin = (userFromForm) => {
        setCurrentUser(userFromForm);
        localStorage.setItem("myAppUser", JSON.stringify(userFromForm));
    };

    // Logout: ลบออกจากเครื่อง
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

                   
                    <Route element={
                        // ส่ง currentUser เข้าไปเช็คสิทธิ์
                        <ProtectedRoute user={currentUser} allowedRoles={['admin', 'it', 'user',]}>
                            <Layouts onLogout={handleLogout} user={currentUser} />
                        </ProtectedRoute>
                    }>
                        
                        <Route path="/dashboard" element={<Dashboard user={currentUser} />} />
                        <Route path="/inbox" element={<Inbox currentUser={currentUser} />} />
                        <Route path="/setting" element={<Setting user={currentUser} />} />
                        <Route path="/log" element={<Log/>} />
                        <Route path="/notification" element={<Notifiacation/>}/>
                        <Route path="/member" element={<Member/>}/>

                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;