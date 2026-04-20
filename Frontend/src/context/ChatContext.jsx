import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useRef,
} from "react";

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

// Helper: แปลง LINE emoji markers ใน last message ให้อ่านง่าย
const LINE_EMOJI_RE = /\[line-emoji:[^\]]+\]/g;
const sanitizeLastText = (text) => {
    if (!text) return text;
    // ถ้าไม่มี LINE emoji marker เลย → คืนค่าเดิม
    if (!text.includes("[line-emoji:")) return text;
    // แทนที่ marker ด้วย "(อีโมจิ)"
    const replaced = text.replace(LINE_EMOJI_RE, "(อีโมจิ)").trim();
    // ถ้าผลลัพธ์เป็นแค่ "(อีโมจิ)" ซ้ำๆ → ย่อเป็นอันเดียว
    if (/^\(อีโมจิ\)(\s*\(อีโมจิ\))*$/.test(replaced)) return "(อีโมจิ)";
    return replaced;
};

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState({});
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState({}); // { customerId: count }
    const activeCustomerIdRef = useRef(null); // เก็บ customerId ที่กำลังเปิดดูอยู่

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
                        id: c.cus_id,
                        name: c.display_name || c.cus_name || `Customer #${c.cus_id}`,
                        originalName: c.cus_name || `Customer #${c.cus_id}`,
                        img: c.cus_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.cus_name || 'User')}&background=random&size=200`,
                        app: c.channel_name || (c.platform === "line" ? "Line" : "Facebook"),
                        platform: c.platform,
                        platform_id: c.platform_id,
                        channel_id: c.channel_id || null,
                        channel_name: c.channel_name || null,
                        status: c.status || STATUS.NOT_STARTED,
                        assigned_to: c.assigned_to || null,
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
                                const lastText = lastMsg.message_type === "carousel"
                                    ? "📋 Card Message"
                                    : lastMsg.message_type === "image"
                                        ? "📷 รูปภาพ"
                                        : lastMsg.message_type === "sticker"
                                            ? "🎨 สติกเกอร์"
                                            : sanitizeLastText(lastMsg.text) || "(รูปภาพ)";
                                return { ...c, last: lastText };
                            }
                            return c;
                        }),
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
            const lastText =
                msg.message_type === "carousel"
                    ? "📋 Card Message"
                    : msg.message_type === "image"
                        ? "📷 รูปภาพ"
                        : msg.message_type === "sticker"
                            ? "🎨 สติกเกอร์"
                            : sanitizeLastText(msg.text) ||
                            (msg.image && msg.image.includes("stickershop")
                                ? "(สติกเกอร์)"
                                : "(รูปภาพ)");
            setCustomers((prev) => {
                const updated = prev.map((c) =>
                    c.id === cid ? { ...c, last: lastText } : c,
                );
                // ย้ายลูกค้าที่ส่งข้อความมาล่าสุดขึ้นบนสุด
                const idx = updated.findIndex((c) => c.id === cid);
                if (idx > 0) {
                    const [customer] = updated.splice(idx, 1);
                    updated.unshift(customer);
                }
                return updated;
            });

            // เพิ่ม unread count (เฉพาะข้อความจากลูกค้า + ไม่ได้เปิดแชทนั้นอยู่)
            if (msg.sender !== "own" && cid !== activeCustomerIdRef.current) {
                setUnreadCounts((prev) => ({
                    ...prev,
                    [cid]: (prev[cid] || 0) + 1,
                }));
            }
        });

        // อัปเดตโปรไฟล์ลูกค้า real-time (หลัง refresh ทุก 24 ชม.)
        socket.on("update-customer", (cust) => {
            setCustomers((prev) =>
                prev.map((c) => {
                    if (c.id !== cust.cus_id) return c;
                    const newOriginalName = cust.cus_name || c.originalName;
                    // ถ้า admin ยังไม่ได้ตั้งชื่อ (name === originalName) → อัปเดตชื่อแสดงด้วย
                    const newName = c.name === c.originalName ? newOriginalName : c.name;
                    return {
                        ...c,
                        originalName: newOriginalName,
                        name: newName,
                        img: cust.cus_picture || c.img,
                    };
                }),
            );
        });

        // รับลูกค้าใหม่แบบ real-time (ไม่ต้องรีเฟรช)
        socket.on("new-customer", (cust) => {
            setCustomers((prev) => {
                // ตรวจสอบว่ามีอยู่แล้วหรือยัง
                if (prev.some((c) => c.id === cust.cus_id)) return prev;
                return [
                    {
                        id: cust.cus_id,
                        name:
                            cust.display_name || cust.cus_name || `Customer #${cust.cus_id}`,
                        originalName: cust.cus_name || `Customer #${cust.cus_id}`,
                        img: cust.cus_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.cus_name || 'User')}&background=random&size=200`,
                        app: cust.channel_name || (cust.platform === "line" ? "Line" : "Facebook"),
                        platform: cust.platform,
                        platform_id: cust.platform_id,
                        channel_id: cust.channel_id || null,
                        channel_name: cust.channel_name || null,
                        status: cust.status || STATUS.NOT_STARTED,
                        assigned_to: cust.assigned_to || null,
                        last: cust.first_message || "",
                    },
                    ...prev,
                ];
            });
        });

        // อัปเดต assigned_to แบบ real-time (จาก client อื่น)
        socket.on("customer-assigned", ({ cus_id, assigned_to }) => {
            setCustomers((prev) =>
                prev.map((c) =>
                    c.id === cus_id ? { ...c, assigned_to } : c,
                ),
            );
        });

        return () => socket.disconnect();
    }, []);

    // ---------- ส่งข้อความ ----------
    const sendMessage = useCallback(async (customerId, text, replyTo = null) => {
        const newMsg = {
            id: Date.now(),
            sender: "own",
            text: text,
            created_at: new Date().toISOString(),
            reply_to_id: replyTo ? replyTo.id : null,
            reply_preview_text: replyTo ? replyTo.preview_text : null,
            reply_preview_image: replyTo ? replyTo.preview_image : null,
        };

        // อัปเดต UI ทันที (optimistic)
        setMessages((prev) => ({
            ...prev,
            [customerId]: [...(prev[customerId] || []), newMsg],
        }));

        setCustomers((prev) => {
            const updated = prev.map((c) =>
                c.id === customerId ? { ...c, last: text } : c,
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
                    reply_to_id: replyTo ? replyTo.id : null,
                    reply_preview_text: replyTo ? replyTo.preview_text : null,
                    reply_preview_image: replyTo ? replyTo.preview_image : null,
                }),
            });
        } catch (err) {
            console.error("Send message error:", err);
        }
    }, []);

    // ---------- ส่งรูปภาพ ----------
    const sendImageMessage = useCallback(async (customerId, imageFile, replyTo = null) => {
        try {
            const formData = new FormData();
            formData.append("image", imageFile);

            const uploadRes = await fetch("/api/messages/upload-image", {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` },
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const { filename, url } = await uploadRes.json();

            // --- จุดที่ 1: Optimistic Update ---
            const newMsg = {
                id: Date.now(),
                sender: "own",
                message_type: "image",
                image: url,
                created_at: new Date().toISOString(),
                reply_to_id: replyTo ? replyTo.id : null,
                reply_preview_text: replyTo ? replyTo.preview_text : null,
                reply_preview_image: replyTo ? replyTo.preview_image : null,
            };

            setMessages((prev) => ({
                ...prev,
                [customerId]: [...(prev[customerId] || []), newMsg],
            }));

            // อัปเดต sidebar: แสดง "รูปภาพ" และย้ายขึ้นบนสุด
            setCustomers((prev) => {
                const updated = prev.map((c) =>
                    c.id === customerId ? { ...c, last: "📷 รูปภาพ" } : c,
                );
                const idx = updated.findIndex((c) => c.id === customerId);
                if (idx > 0) {
                    const [cust] = updated.splice(idx, 1);
                    updated.unshift(cust);
                }
                return updated;
            });

            // --- จุดที่ 2: ส่งข้อมูลลง DB ---
            await fetch("/api/messages", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    customer_id: customerId,
                    sender: "own",
                    message_type: "image",
                    message_text: url,
                    socket_id: socketRef.current?.id || null,
                    reply_to_id: replyTo ? replyTo.id : null,
                    reply_preview_text: replyTo ? replyTo.preview_text : null,
                    reply_preview_image: replyTo ? replyTo.preview_image : null,
                }),
            });
        } catch (err) {
            console.error("Send image error:", err);
        }
    }, []);

    // ---------- ส่งข้อความแบบ Carousel (Multiple Cards) ----------
    const sendCarouselMessage = useCallback(async (customerId, cards) => {
        try {
            if (!cards || cards.length === 0) return;

            // 1. ตรวจสอบและอัปโหลด base64 image เป็น URL ก่อน
            const processedCards = await Promise.all(
                cards.map(async (c) => {
                    // End cards have no image — skip upload entirely
                    if (c.isEndCard) {
                        return {
                            image: null,
                            message: c.message ? c.message.trim() : "ดูรายละเอียด",
                            tag: c.tag || "",
                            isEndCard: true,
                        };
                    }

                    let finalUrl = c.image;
                    // ถ้าเป็น base64 ให้แปลงและอัปโหลดผ่าน endpoint /api/messages/upload-image
                    if (finalUrl && finalUrl.startsWith("data:")) {
                        try {
                            const [header, b64] = finalUrl.split(",");
                            const mime = header.match(/:(.*?);/)?.[1] || "image/jpeg";
                            const binary = atob(b64);
                            const bytes = new Uint8Array(binary.length);
                            for (let i = 0; i < binary.length; i++) {
                                bytes[i] = binary.charCodeAt(i);
                            }
                            const blob = new Blob([bytes], { type: mime });
                            const ext = mime.split("/")[1] || "jpg";
                            const file = new File([blob], `carousel_card.${ext}`, { type: mime });

                            const formData = new FormData();
                            formData.append("image", file);

                            const uploadRes = await fetch("/api/messages/upload-image", {
                                method: "POST",
                                headers: { Authorization: `Bearer ${getToken()}` },
                                body: formData,
                            });

                            if (uploadRes.ok) {
                                const { url } = await uploadRes.json();
                                finalUrl = url;
                            }
                        } catch (err) {
                            console.error("Failed to parse/upload base64 carousel card:", err);
                        }
                    }
                    return {
                        image: finalUrl,
                        message: c.message ? c.message.trim() : "",
                        tag: c.tag || "",
                        isEndCard: false,
                    };
                })
            );

            const cardsJson = JSON.stringify(processedCards);

            // --- จุดที่ 1: Optimistic Update ---
            const newMsg = {
                id: Date.now(),
                sender: "own",
                message_type: "carousel",
                text: cardsJson,
                created_at: new Date().toISOString(),
            };

            setMessages((prev) => ({
                ...prev,
                [customerId]: [...(prev[customerId] || []), newMsg],
            }));

            // อัปเดต sidebar
            setCustomers((prev) => {
                const updated = prev.map((c) =>
                    c.id === customerId ? { ...c, last: "📋 Carousel Message" } : c
                );
                const idx = updated.findIndex((c) => c.id === customerId);
                if (idx > 0) {
                    const [cust] = updated.splice(idx, 1);
                    updated.unshift(cust);
                }
                return updated;
            });

            // --- จุดที่ 2: ส่งข้อมูลลง DB ---
            await fetch("/api/messages", {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    customer_id: customerId,
                    sender: "own",
                    message_type: "carousel",
                    message_text: cardsJson,
                    socket_id: socketRef.current?.id || null,
                }),
            });
        } catch (err) {
            console.error("Send carousel error:", err);
        }
    }, []);

    // ---------- อ่านแล้ว (clear unread) ----------
    const markAsRead = useCallback((customerId) => {
        activeCustomerIdRef.current = customerId; // อัปเดตว่ากำลังดูแชทไหนอยู่
        setUnreadCounts((prev) => {
            if (!prev[customerId]) return prev;
            const next = { ...prev };
            delete next[customerId];
            return next;
        });
    }, []);

    // ---------- อัปเดตสถานะลูกค้า ----------
    const updateCustomerStatus = useCallback(async (customerId, newStatus) => {
        setCustomers((prev) =>
            prev.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c)),
        );
        try {
            await fetch(`/api/customers/${customerId}/status`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (err) {
            console.error("Update status error:", err);
        }
    }, []);

    // ---------- อัปเดตผู้รับผิดชอบ (assigned_to) ----------
    const updateCustomerAssign = useCallback(async (customerId, empId) => {
        // อัปเดต UI ทันที (optimistic)
        setCustomers((prev) =>
            prev.map((c) =>
                c.id === customerId ? { ...c, assigned_to: empId } : c,
            ),
        );
        try {
            await fetch(`/api/customers/${customerId}/assign`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ emp_id: empId }),
            });
        } catch (err) {
            console.error("Update assigned_to error:", err);
        }
    }, []);

    // ---------- อัปเดตชื่อลูกค้า ----------
    const updateCustomerName = useCallback(async (customerId, newName) => {
        setCustomers((prev) =>
            prev.map((c) => {
                if (c.id !== customerId) return c;
                // ถ้า newName เป็น null → กลับไปใช้ชื่อจาก platform (originalName)
                const displayName = newName || c.originalName;
                return { ...c, name: displayName };
            }),
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
                sendCarouselMessage,
                updateCustomerStatus,
                updateCustomerName,
                updateCustomerAssign,
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
