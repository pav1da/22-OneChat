import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { io } from "socket.io-client";

// สถานะของแชทลูกค้า
const STATUS = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังดำเนินการ",
  DONE: "เสร็จสิ้น",
};

const ChatContext = createContext(null);

// Helper: ดึง token จาก localStorage หรือ sessionStorage
const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

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
          c.id === cid ? { ...c, last: msg.text || "(รูปภาพ)" } : c
        )
      );
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
        }),
      });
    } catch (err) {
      console.error("Send message error:", err);
    }
  }, []);

  // ---------- ส่งรูปภาพ ----------
  const sendImageMessage = useCallback(async (customerId, imageUrl) => {
    const newMsg = {
      id: Date.now(),
      sender: "own",
      image: imageUrl,
    };

    setMessages((prev) => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), newMsg],
    }));

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          customer_id: customerId,
          sender: "own",
          message_type: "image",
          message_text: imageUrl,
        }),
      });
    } catch (err) {
      console.error("Send image error:", err);
    }
  }, []);

  // ---------- ส่ง Template ----------
  const sendTemplateMessage = useCallback(async (customerId, template) => {
    const newMsg = {
      id: Date.now(),
      sender: "own",
      text: `[Template] ${template.name}`,
    };

    setMessages((prev) => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), newMsg],
    }));

    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          customer_id: customerId,
          sender: "own",
          message_type: "template",
          message_text: JSON.stringify({ id: template.id, name: template.name, type: template.type, content: typeof template.content === 'string' ? JSON.parse(template.content) : template.content }),
        }),
      });
    } catch (err) {
      console.error("Send template error:", err);
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
        sendTemplateMessage,
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
