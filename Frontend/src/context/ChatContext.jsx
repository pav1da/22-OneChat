import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";


// สถานะของแชทลูกค้า
const STATUS = {
    NOT_STARTED: "ยังไม่เริ่ม",
    IN_PROGRESS: "กำลังดำเนินการ",
    DONE: "เสร็จสิ้น",
};


const ChatContext = createContext(null);
const socketRef = { current: null };


// Helper: ดึง token จาก localStorage
const getToken = () => sessionStorage.getItem("token");


const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
});


export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState({});
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState({}); // { customerId: count }

    // ---------- โหลดข้อมูลตอน mount ----------
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = getToken();
                if (!token) {
                    setLoading(false);
                    return;
                }

                // ดึงลูกค้าและข้อความพร้อมกัน
                const [custRes, msgRes] = await Promise.all([
                    fetch("/api/customers", { headers: getHeaders() }),
                    fetch("/api/messages", { headers: getHeaders() }),
                ]);

                if (custRes.ok) {
                    const custData = await custRes.json();
                    // แปลงข้อมูลให้ตรงกับ format เดิมที่ frontend ใช้
                    const mapped = custData.map((c) => ({
                        id: c.id,
                        name: c.display_name || `Customer #${c.id}`,
                        originalName: c.display_name || `Customer #${c.id}`,
                        img: c.picture_url || "",
                        app: c.platform ? `${c.platform === "line" ? "Line" : "Facebook"}` : "",
                        platform: c.platform,
                        platform_id: c.platform_id,
                        status: STATUS.NOT_STARTED,
                        last: "",
                    }));
                    setCustomers(mapped);
                }

                if (msgRes.ok) {
                    const msgData = await msgRes.json();
                    setMessages(msgData);

                    // อัปเดต last message ของแต่ละลูกค้า
                    setCustomers((prev) =>
                        prev.map((c) => {
                            const msgs = msgData[c.id];
                            if (msgs && msgs.length > 0) {
                                const lastMsg = msgs[msgs.length - 1];
                                return { ...c, last: lastMsg.text || "(รูปภาพ)" };
                            }
                            return c;
                        })
                    );
                }
            } catch (err) {
                console.error("Failed to fetch chat data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ---------- Socket.IO: รับข้อความ real-time ----------
    useEffect(() => {
        const socket = io();
        socketRef.current = socket;

        socket.on("new-message", (msg) => {
            const cid = msg.customer_id;

            // เพิ่มข้อความเข้า state
            setMessages((prev) => ({
                ...prev,
                [cid]: [...(prev[cid] || []), msg],
            }));

            // อัปเดต last message + ย้ายลูกค้าขึ้นบนสุด
            const lastText = msg.text || (msg.image && msg.image.includes("stickershop") ? "(สติกเกอร์)" : "(รูปภาพ)");
            setCustomers((prev) => {
                const updated = prev.map((c) =>
                    c.id === cid ? { ...c, last: lastText } : c
                );
                // ย้ายลูกค้าที่ส่งข้อความมาล่าสุดขึ้นบนสุด
                const idx = updated.findIndex((c) => c.id === cid);
                if (idx > 0) {
                    const [customer] = updated.splice(idx, 1);
                    updated.unshift(customer);
                }
                return updated;
            });

            // เพิ่ม unread count (เฉพาะข้อความจากลูกค้า)
            if (msg.sender !== "own") {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [cid]: (prev[cid] || 0) + 1,
                }));
            }
        });

        // อัปเดตโปรไฟล์ลูกค้า real-time (หลัง refresh ทุก 24 ชม.)
        socket.on("update-customer", (cust) => {
            setCustomers((prev) =>
                prev.map((c) =>
                    c.id === cust.id
                        ? { ...c, name: cust.display_name || c.name, originalName: cust.display_name || c.originalName, img: cust.picture_url || c.img }
                        : c
                )
            );
        });

        // รับลูกค้าใหม่แบบ real-time (ไม่ต้องรีเฟรช)
        socket.on("new-customer", (cust) => {
            setCustomers((prev) => {
                // ตรวจสอบว่ามีอยู่แล้วหรือยัง
                if (prev.some((c) => c.id === cust.id)) return prev;
                return [
                    {
                        id: cust.id,
                        name: cust.display_name || `Customer #${cust.id}`,
                        originalName: cust.display_name || `Customer #${cust.id}`,
                        img: cust.picture_url || "",
                        app: cust.platform === "line" ? "Line" : "Facebook",
                        platform: cust.platform,
                        platform_id: cust.platform_id,
                        status: STATUS.NOT_STARTED,
                        last: cust.first_message || "",
                    },
                    ...prev,
                ];
            });
        });

        return () => socket.disconnect();
    }, []);

    // ---------- ส่งข้อความ ----------
    const sendMessage = useCallback(async (customerId, text) => {
        const newMsg = {
            id: Date.now(),
            sender: "own",
            text: text,
        };

        // อัปเดต UI ทันที (optimistic)
        setMessages((prev) => ({
            ...prev,
            [customerId]: [...(prev[customerId] || []), newMsg],
        }));

        setCustomers((prev) => {
            const updated = prev.map((c) =>
                c.id === customerId ? { ...c, last: text } : c
            );
            // ย้ายลูกค้าที่ส่งข้อความไปหาขึ้นบนสุด
            const idx = updated.findIndex((c) => c.id === customerId);
            if (idx > 0) {
                const [cust] = updated.splice(idx, 1);
                updated.unshift(cust);
            }
            return updated;
        });

        // ส่งไป API
        try {
            await fetch("/api/messages", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    customer_id: customerId,
                    sender: "own",
                    message_type: "text",
                    message_text: text,
                    socket_id: socketRef.current?.id || null,
                }),
            });
        } catch (err) {
            console.error("Send message error:", err);
        }
    }, []);

    // ---------- ส่งรูปภาพ ----------
    const sendImageMessage = useCallback(async (customerId, imageFile) => {
        try {
            // ขั้นตอนที่ 1: อัปโหลดไฟล์รูปภาพไปยัง Backend ก่อน
            const formData = new FormData();
            formData.append("image", imageFile);

            const uploadRes = await fetch("/api/messages/upload-image", {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const { filename, url } = await uploadRes.json();

            // ขั้นตอนที่ 2: แสดงรูปใน UI ทันที (optimistic)
            const newMsg = {
                id: Date.now(),
                sender: "own",
                image: url,
            };
            setMessages((prev) => ({
                ...prev,
                [customerId]: [...(prev[customerId] || []), newMsg],
            }));

            // ขั้นตอนที่ 3: บันทึกข้อความลง DB + ส่งไป LINE
            await fetch("/api/messages", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    customer_id: customerId,
                    sender: "own",
                    message_type: "image",
                    message_text: filename,
                    socket_id: socketRef.current?.id || null,
                }),
            });
        } catch (err) {
            console.error("Send image error:", err);
        }
    }, []);

    // ---------- อ่านแล้ว (clear unread) ----------
    const markAsRead = useCallback((customerId) => {
        setUnreadCounts((prev) => {
            if (!prev[customerId]) return prev;
            const next = { ...prev };
            delete next[customerId];
            return next;
        });
    }, []);

    // ---------- อัปเดตสถานะลูกค้า (local only) ----------
    const updateCustomerStatus = useCallback((customerId, newStatus) => {
        setCustomers((prev) =>
            prev.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c))
        );
    }, []);

    // ---------- อัปเดตชื่อลูกค้า ----------
    const updateCustomerName = useCallback(async (customerId, newName) => {
        setCustomers((prev) =>
            prev.map((c) => (c.id === customerId ? { ...c, name: newName } : c))
        );

        try {
            await fetch(`/api/customers/${customerId}/name`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ name: newName }),
            });
        } catch (err) {
            console.error("Update name error:", err);
        }
    }, []);

    return (
        <ChatContext.Provider
            value={{
                messages,
                customers,
                loading,
                unreadCounts,
                sendMessage,
                sendImageMessage,
                updateCustomerStatus,
                updateCustomerName,
                markAsRead,
                STATUS,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};


export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};


export { STATUS };



