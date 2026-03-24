// ===================================================================
// SocketContext.jsx — Context สำหรับจัดการ Socket.IO connection
// ===================================================================
// ทำหน้าที่:
// 1. สร้าง Socket.IO connection ไปยัง Backend พร้อมส่ง emp_id
// 2. ติดตามสถานะ online/offline ของ user ทุกคนแบบ real-time
// 3. ให้ component อื่นๆ (เช่น Member.jsx) เรียกใช้ผ่าน useSocket()
// 4. จัดการ disconnect เมื่อ user logout ออกจากระบบ
// ===================================================================

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

// สร้าง Context สำหรับแชร์ข้อมูล socket ให้ทุก component
const SocketContext = createContext(null);

// Custom Hook สำหรับเรียกใช้ SocketContext ได้ง่ายๆ
// ตัวอย่าง: const { isUserOnline } = useSocket();
export const useSocket = () => useContext(SocketContext);

// ===================================================================
// SocketProvider — Component ที่ครอบ (wrap) component ลูกๆ
// ให้ทุก component ด้านในสามารถเข้าถึงข้อมูล online status ได้
// ===================================================================
export const SocketProvider = ({ children }) => {
  // Map เก็บ emp_id ของ user ที่ online อยู่ (key: emp_id, value: true)
  const [onlineUsers, setOnlineUsers] = useState(new Map());

  // useRef เก็บ reference ของ socket instance (ไม่ re-render เมื่อเปลี่ยน)
  const socketRef = useRef(null);

  useEffect(() => {
    // --- ดึงข้อมูล user ปัจจุบันจาก sessionStorage ---
    // sessionStorage ถูกตั้งค่าตอน login ใน SignInPage/SignUpPage
    const savedUser = sessionStorage.getItem("myAppUser");
    if (!savedUser) return; // ถ้ายังไม่ login → ไม่ต้องเชื่อมต่อ socket

    const user = JSON.parse(savedUser);
    const empId = user.emp_id; // รหัสพนักงานของ user ที่ login อยู่
    if (!empId) return;

    // --- สร้าง Socket.IO connection ---
    // ส่ง emp_id ผ่าน auth object → Backend จะรับจาก socket.handshake.auth.emp_id
    // ไม่ต้องระบุ URL เพราะ Vite proxy จะ forward /socket.io ไปที่ localhost:3000 ให้
    const socket = io({
      auth: { emp_id: empId },
    });
    socketRef.current = socket;

    // --- Event: "online-users" ---
    // Server ส่งรายชื่อ user ที่ online ทั้งหมดให้ตอนเชื่อมต่อครั้งแรก
    // เพื่อให้รู้สถานะของทุกคนทันทีไม่ต้องรอ event ทีละคน
    socket.on("online-users", (users) => {
      const map = new Map();
      users.forEach((u) => map.set(u.emp_id, true));
      setOnlineUsers(map); // เซ็ต state เป็น Map ของคนที่ online
    });

    // --- Event: "user-status-changed" ---
    // Server broadcast event นี้ทุกครั้งที่มีคน login/logout หรือปิด tab
    // รับ { emp_id, is_online } แล้วอัปเดต Map
    socket.on("user-status-changed", ({ emp_id, is_online }) => {
      setOnlineUsers((prev) => {
        const updated = new Map(prev);
        if (is_online) {
          updated.set(emp_id, true); // เพิ่มเข้า Map = online
        } else {
          updated.delete(emp_id);    // ลบออกจาก Map = offline
        }
        return updated;
      });
    });

    // --- ฟัง event "app-logout" จาก App.jsx ---
    // เมื่อ user กด logout → App.jsx จะ dispatch event "app-logout"
    // SocketContext จะ disconnect socket ก่อนที่ sessionStorage จะถูกล้าง
    // ทำให้ Backend รู้ว่า user offline ทันที (ไม่ต้องรอ timeout)
    const handleLogout = () => {
      socket.disconnect();
      socketRef.current = null;
    };
    window.addEventListener("app-logout", handleLogout);

    // --- Cleanup: ทำงานเมื่อ component ถูกทำลาย (unmount) ---
    return () => {
      window.removeEventListener("app-logout", handleLogout);
      socket.disconnect();    // ตัดการเชื่อมต่อ socket
      socketRef.current = null;
    };
  }, []); // [] = ทำงานครั้งเดียวตอน mount

  // ===================================================================
  // ฟังก์ชันที่ให้ component อื่นเรียกใช้
  // ===================================================================

  // ตรวจสอบว่า user คนนี้ online หรือไม่
  // ใช้ใน Member.jsx: const online = isUserOnline(member.id)
  const isUserOnline = (empId) => onlineUsers.has(empId);

  // ฟังก์ชัน disconnect socket โดยตรง (สำรองไว้ใช้กรณีต้องการ manual disconnect)
  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  };

  // --- ส่งค่าผ่าน Context ให้ทุก component ลูก ---
  // onlineUsers: Map ของ emp_id ที่ online (สำหรับอ่านโดยตรง)
  // isUserOnline: ฟังก์ชันเช็คว่า emp_id นี้ online ไหม (สะดวกกว่าอ่าน Map)
  // disconnectSocket: ฟังก์ชัน disconnect socket
  return (
    <SocketContext.Provider value={{ onlineUsers, isUserOnline, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
