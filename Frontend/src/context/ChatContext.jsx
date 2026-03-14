import { createContext, useContext, useState, useCallback } from "react";
import { initialChatMessages } from "../data/messages";
import { fetchCustomer } from "../data/customer";

// สถานะของแชทลูกค้า
const STATUS = {
  NOT_STARTED: "ยังไม่เริ่ม",
  IN_PROGRESS: "กำลังดำเนินการ",
  DONE: "เสร็จสิ้น",
};

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState(initialChatMessages);
  const [customers, setCustomers] = useState(() => {
    const allCustomers = fetchCustomer();
    return allCustomers.map((c) => ({
      ...c,
      originalName: c.name,
      status:
        c.inprocess === true
          ? STATUS.IN_PROGRESS
          : c.inprocess === false
            ? STATUS.DONE
            : STATUS.NOT_STARTED,
    }));
  });

  // ส่งข้อความ — ใช้ได้ทั้งจาก mini chat และ Inbox
  const sendMessage = useCallback((customerId, text) => {
    const newMsg = {
      id: Date.now(),
      sender: "own",
      text: text,
    };

    setMessages((prev) => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), newMsg],
    }));

    // อัปเดตข้อความล่าสุดบน card
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, last: text } : c)),
    );
  }, []);

  // ส่งข้อความแบบมีรูป
  const sendImageMessage = useCallback((customerId, imageUrl) => {
    const newMsg = {
      id: Date.now(),
      sender: "own",
      image: imageUrl,
    };

    setMessages((prev) => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), newMsg],
    }));
  }, []);

  // อัปเดตสถานะลูกค้า
  const updateCustomerStatus = useCallback((customerId, newStatus) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, status: newStatus } : c)),
    );
  }, []);

  // อัปเดตชื่อลูกค้า
  const updateCustomerName = useCallback((customerId, newName) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, name: newName } : c)),
    );
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        customers,
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
