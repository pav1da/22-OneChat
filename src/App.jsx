// src/App.js


import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SignUpPage from './page/SignUpPage';
import SignInPage from './page/SignInPage';
import Home from './page/Home';
// import อื่นๆ เช่น SignInPage, TermsPage...


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ตั้งค่า Route หลักให้ไปที่หน้า SignUpPage */}
        <Route path="/" element={<SignUpPage />} />
       
        {/* สร้าง Route สำหรับ Link อื่นๆ ที่เราสร้างไว้ */}
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/terms" element={<div>หน้า Terms of Service</div>} />
        <Route path="/privacy" element={<div>หน้า Privacy</div>} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;
