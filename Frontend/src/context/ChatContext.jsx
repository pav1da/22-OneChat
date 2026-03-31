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

      // อัปเดต last message ของลูกค้า
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === cid ? { ...c, last: msg.text || (msg.image && msg.image.includes("stickershop") ? "(สติกเกอร์)" : "(รูปภาพ)") } : c
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
            last: "",
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

    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, last: text } : c))
    );

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
  const sendImageMessage = useCallback(async (customerId, file) => {
    // Optimistic update ด้วย blob URL ก่อน
    const blobUrl = URL.createObjectURL(file);
    const tempId = Date.now();
    setMessages((prev) => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), { id: tempId, sender: "own", image: blobUrl }],
    }));

    try {
      // 1. อัปโหลดไฟล์ไปยัง server
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await fetch("/api/messages/upload-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const { filename, url: serverUrl } = await uploadRes.json();

      // 2. แทนที่ blob URL ด้วย server URL ใน state
      setMessages((prev) => ({
        ...prev,
        [customerId]: (prev[customerId] || []).map((m) =>
          m.id === tempId ? { ...m, image: serverUrl } : m
        ),
      }));
      URL.revokeObjectURL(blobUrl);

      // 3. บันทึกข้อความลง DB + ส่งไปยัง LINE
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
      URL.revokeObjectURL(blobUrl);
    }
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
        sendMessage,
        sendImageMessage,
        updateCustomerStatus,
        updateCustomerName,
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
