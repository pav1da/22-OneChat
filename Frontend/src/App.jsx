// react dependencies
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

// user components
import Layouts from "./layouts/Layouts";
import SignUpPage from "./page/SignUpPage";
import SignInPage from "./page/SignInPage";
import Home from "./page/Home";
import Notes from "./page/notes/notes";
import Inbox from "./page/chat/chat";
import MyChat from "./page/mychats/mychat";
import Setting from "./page/SettingPages/Setting";
import Notifiacation from "./page/notification/Notification";
import Log from "./page/Log";
import Member from "./page/member/Member";
import Teams from "./page/team/team";
import TokenReport from "./page/TokenReport";
import AllChat from "./page/chat/allchat/Allchat"; 
import CardMessage from "./page/CardmessagePage/Cardmessage";
import { ChatProvider } from "./context/ChatContext";
import { TeamProvider } from "./context/TeamContext";
// นำเข้า SocketProvider สำหรับจัดการ Socket.IO connection (ระบบ online/offline)
// SocketProvider จะครอบ component ทั้งหมดที่ต้องการเข้าถึงสถานะ online
import { SocketProvider, useSocket } from "./context/SocketContext";

// stylesheets
import "./App.css";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    // ให้ไปเช็คใน sessionStorage ก่อนว่ามีของเก่าไหม
    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = sessionStorage.getItem("myAppUser");
        const token = sessionStorage.getItem("token");
        if (savedUser && token) {
            const parsed = JSON.parse(savedUser);
            // ตรวจสอบว่า role ตรงกับ DB roles หรือไม่
            const validRoles = ["admin", "manager", "staff"];
            if (parsed.role && validRoles.includes(parsed.role)) {
                return parsed;
            }
            // ถ้า role ไม่ valid (จาก mock data เก่า) ให้ล้างออก
            sessionStorage.removeItem("myAppUser");
            sessionStorage.removeItem("token");
        }
        return null;
    });

    useEffect(() => {
        sessionStorage.removeItem("dashboardNotes");
    }, []);

    const handleLogin = (userFromForm) => {
        setCurrentUser(userFromForm);
        sessionStorage.setItem("myAppUser", JSON.stringify(userFromForm));
        // token จะถูกเก็บจาก SignInPage/SignUpPage โดยตรง
    };

    const handleLogout = async () => {
        // บันทึก log ก่อน logout (fire-and-forget)
        try {
            const token = sessionStorage.getItem("token");
            const user = JSON.parse(sessionStorage.getItem("myAppUser") || "{}");
            if (token && user.username) {
                fetch("/api/logs", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        user: user.username,
                        avatar: null,
                        action: "ออกจากระบบ",
                        target: "",
                        details: "",
                    }),
                }).catch(() => {});
            }
        } catch {}
        // ส่ง event "app-logout" ให้ SocketContext รับฟัง
        // SocketContext จะ disconnect socket ก่อนที่ sessionStorage จะถูกล้าง
        // ทำให้ Backend รับรู้ว่า user offline ทันที (ไม่ต้องรอ socket timeout)
        window.dispatchEvent(new Event("app-logout"));
        setCurrentUser(null);
        sessionStorage.removeItem("myAppUser");
        sessionStorage.removeItem("token");
    };

    return (
        <div>
            <BrowserRouter basename="/onechat/">
                {/* Use a nested component so we can call useLocation (must be inside Router) */}
                <AppRoutes currentUser={currentUser} handleLogin={handleLogin} handleLogout={handleLogout} />
            </BrowserRouter>
        </div>
    );
}

function AppRoutes({ currentUser, handleLogin, handleLogout }) {
    const location = useLocation();
    const background = location.state && location.state.background;

    return (
        <>
            <Routes location={background || location}>
                {/* --- Public --- */}
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/signup" element={<SignUpPage onLogin={handleLogin} />} />
                <Route
                    path="/signin"
                    element={
                        currentUser ? (
                            <Navigate to="/notes" />
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
                            {/* SocketProvider: สร้าง Socket.IO connection เชื่อมกับ Backend */}
                            {/* ทุก component ด้านในสามารถใช้ useSocket() เพื่อเช็คสถานะ online ได้ */}
                            <SocketProvider>
                                <TeamProvider currentUser={currentUser}>
                                    <ChatProvider>
                                        <Layouts onLogout={handleLogout} user={currentUser} />
                                    </ChatProvider>
                                </TeamProvider>
                            </SocketProvider>
                        </ProtectedRoute>
                    }
                >
                    <Route path="/notes" element={<Notes user={currentUser} />} />
                    <Route path="/allchat" element={<AllChat currentUser={currentUser} />} />
                    <Route path="/mychat" element={<MyChat currentUser={currentUser} />} />
                    <Route path="/inbox" element={<Inbox currentUser={currentUser} />} />
                    <Route path="/cardmessage" element={<CardMessage currentUser={currentUser} />} />
                    <Route path="/log" element={<Log />} />
                    <Route path="/notification" element={<Notifiacation />} />
                    <Route path="/member" element={<Member currentUser={currentUser} />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/tokenreport" element={<TokenReport />} />
                    <Route path="/setting" element={<Setting user={currentUser} />} />
                </Route>
            </Routes>

            {/* When navigated with a background, render the setting route as a modal on top */}
            {background && (
                <Routes>
                    <Route path="/setting" element={<Setting user={currentUser} />} />
                </Routes>
            )}
        </>
    );
}

export default App;
