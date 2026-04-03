// react dependencies
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// user components
import Layouts from "./layouts/Layouts";
import SignUpPage from "./page/SignUpPage";
import SignInPage from "./page/SignInPage";
import Home from "./page/Home";
import Dashboard from "./page/Dashboard";
import Inbox from "./page/Inbox/Inbox";

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
                            <Layouts onLogout={handleLogout} />
                        </ProtectedRoute>
                    }>
                        
                        <Route path="/dashboard" element={<Dashboard user={currentUser} />} />
                        <Route path="/inbox" element={<Inbox />} />
                        <Route path="/setting" element={<Setting user={currentUser} />} />
                        <Route path="/privacy" element={<div>หน้า Privacy</div>} />

                    </Route>
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
