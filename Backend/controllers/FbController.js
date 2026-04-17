const db = require("../config/db.js");
const Log = require("../models/log.js");
const Notification = require("../models/notification.js");

const FB_TOKEN = process.env.FB_TOKEN;

// Helper: สร้างวันที่เวลาแบบ MySQL format
const getLocalDatetime = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// ===== Verify Webhook (GET) =====
// Facebook จะเรียก endpoint นี้เพื่อ verify webhook ตอนตั้งค่าครั้งแรก
exports.verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Facebook Webhook Verified Successfully!");
      res.status(200).send(challenge);
    } else {
      console.log("❌ FB Verify Token ไม่ตรงกัน!");
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

// ===== Handle Webhook (POST) =====
// Facebook ส่ง event ข้อความเข้ามาที่นี่
exports.handleWebhook = async (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    // 🚨 ตอบ Facebook ทันทีว่า "ได้รับแล้ว" (ป้องกันส่งซ้ำ)
    res.status(200).send("EVENT_RECEIVED");

    const io = req.app.get("io");

    // ตรวจสอบ status ของ Facebook channel จาก channels table
    try {
      const [fbChannels] = await db.query(
        "SELECT status FROM channels WHERE platform = 'facebook'"
      );
      if (
        fbChannels.length > 0 &&
        !fbChannels.some((c) => c.status === "active")
      ) {
        console.log("⏸️ Facebook channel ถูกปิดทั้งหมด — ไม่ประมวลผล");
        return;
      }
    } catch (err) {
      console.error("FB Channel status check error:", err.message);
    }

    try {
      for (const entry of body.entry) {
        if (!entry.messaging) continue;

        for (const webhook_event of entry.messaging) {
          const sender_psid = webhook_event.sender.id;

          // === ข้อความ Text ===
          if (webhook_event.message && webhook_event.message.text) {
            await handleTextMessage(io, sender_psid, webhook_event.message.text);
          }

          // === รูปภาพ / Attachments ===
          if (webhook_event.message && webhook_event.message.attachments) {
            await handleAttachments(io, sender_psid, webhook_event.message.attachments);
          }

          // === Postback (ปุ่มกด) ===
          if (webhook_event.postback) {
            console.log(`📌 [Facebook] Postback จาก PSID: ${sender_psid}, payload: ${webhook_event.postback.payload}`);
          }
        }
      }
    } catch (error) {
      console.error("❌ FB webhook error:", error);
    }
  } else {
    res.sendStatus(404);
  }
};

// ===== ส่งข้อความไปยัง Facebook Messenger =====
exports.sendMessage = async (recipientPsid, messageData) => {
  try {
    const fbRes = await fetch(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${FB_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientPsid },
          message: messageData,
        }),
      }
    );

    if (fbRes.ok) {
      console.log(`📤 ส่งข้อความไปยัง Facebook (PSID: ${recipientPsid}) สำเร็จ`);
      return true;
    } else {
      const errData = await fbRes.json();
      console.error("FB send error:", errData);
      return false;
    }
  } catch (err) {
    console.error("FB send message error:", err.message);
    return false;
  }
};

// ===== ส่งข้อความ Text ไปยัง Facebook =====
exports.sendTextMessage = async (recipientPsid, text) => {
  return exports.sendMessage(recipientPsid, { text });
};

// ===== ส่งรูปภาพไปยัง Facebook =====
exports.sendImageMessage = async (recipientPsid, imageUrl) => {
  return exports.sendMessage(recipientPsid, {
    attachment: {
      type: "image",
      payload: { url: imageUrl, is_reusable: true },
    },
  });
};

// ========== Internal Handlers ==========

// จัดการข้อความ Text
async function handleTextMessage(io, sender_psid, text) {
  console.log(`📬 [Facebook] ข้อความ: "${text}" จาก PSID: ${sender_psid}`);

  const { customerId, displayName, pictureUrl, isNew } = await findOrCreateFbCustomer(sender_psid);

  // บันทึกข้อความลง chat_messages
  const msgSql =
    "INSERT INTO chat_messages (customer_id, sender, message_type, message_text) VALUES (?, 'customer', 'text', ?)";
  const [result] = await db.query(msgSql, [customerId, text]);
  console.log(`💾 บันทึกข้อความ FB สำเร็จ (id: ${result.insertId})`);

  // Emit ลูกค้าใหม่ให้ Frontend
  if (isNew && io) {
    io.emit("new-customer", {
      cus_id: customerId,
      cus_name: displayName,
      display_name: null,
      displayname: null,
      cus_picture: pictureUrl,
      platform: "facebook",
      platform_id: sender_psid,
      first_message: text,
    });
  }

  // ส่ง real-time ไป Frontend
  if (io) {
    io.emit("new-message", {
      id: result.insertId,
      customer_id: customerId,
      sender: "customer",
      message_type: "text",
      text: text,
      image: null,
      created_at: getLocalDatetime(),
    });
  }

  // Fire-and-forget: บันทึก Log + Notification
  processLogAndNotification(io, {
    customerId,
    displayName,
    pictureUrl,
    logAction: "ส่งข้อความเข้ามา",
    logDetails: text.length > 50 ? text.substring(0, 50) + "..." : text,
    msgType: "text",
    msgContent: text.length > 30 ? text.substring(0, 30) + "..." : text,
  });
}

// จัดการ Attachments (รูปภาพ, สติกเกอร์, วิดีโอ, ไฟล์)
async function handleAttachments(io, sender_psid, attachments) {
  for (const att of attachments) {
    if (att.type === "image" && att.payload && att.payload.url) {
      const imageUrl = att.payload.url;
      // ตรวจว่าเป็น sticker หรือรูปภาพปกติ
      const isSticker = !!att.payload.sticker_id;
      const msgType = isSticker ? "sticker" : "image";

      console.log(`${isSticker ? "😀" : "🖼️"} [Facebook] ${isSticker ? "สติกเกอร์" : "รูปภาพ"}จาก PSID: ${sender_psid}`);

      const { customerId, displayName, pictureUrl, isNew } = await findOrCreateFbCustomer(sender_psid);

      const msgSql =
        "INSERT INTO chat_messages (customer_id, sender, message_type, message_text) VALUES (?, 'customer', ?, ?)";
      const [result] = await db.query(msgSql, [customerId, msgType, imageUrl]);

      // Emit ลูกค้าใหม่ให้ Frontend
      if (isNew && io) {
        io.emit("new-customer", {
          cus_id: customerId,
          cus_name: displayName,
          display_name: null,
          displayname: null,
          cus_picture: pictureUrl,
          platform: "facebook",
          platform_id: sender_psid,
          first_message: "",
        });
      }

      if (io) {
        io.emit("new-message", {
          id: result.insertId,
          customer_id: customerId,
          sender: "customer",
          message_type: msgType,
          text: null,
          image: imageUrl,
          created_at: getLocalDatetime(),
        });
      }

      // Log + Notification
      processLogAndNotification(io, {
        customerId,
        displayName,
        pictureUrl,
        logAction: isSticker ? "ส่งสติกเกอร์เข้ามา" : "ส่งรูปภาพเข้ามา",
        logDetails: isSticker ? "Facebook Sticker" : "Facebook Image",
        msgType: msgType,
        msgContent: isSticker ? "สติกเกอร์" : "รูปภาพ",
      });
    }

    // สามารถเพิ่ม video, file, audio ในอนาคต
    if (att.type === "video" && att.payload && att.payload.url) {
      console.log(`🎬 [Facebook] วิดีโอจาก PSID: ${sender_psid} (ยังไม่รองรับ)`);
    }
  }
}

// ========== Helper Functions ==========

// ค้นหาหรือสร้างลูกค้า Facebook ใน DB
async function findOrCreateFbCustomer(psid) {
  const [existing] = await db.query(
    "SELECT cus_id, cus_name, cus_picture, updated_at FROM customers WHERE platform = 'facebook' AND platform_id = ?",
    [psid]
  );

  if (existing.length > 0) {
    const customer = existing[0];
    return {
      customerId: customer.cus_id,
      displayName: customer.cus_name,
      pictureUrl: customer.cus_picture || "",
      isNew: false,
    };
  }

  // ดึงชื่อ + รูปโปรไฟล์จาก Facebook Graph API
  let displayName = `FB User ${psid}`;
  let pictureUrl = "";
  try {
    const profileRes = await fetch(
      `https://graph.facebook.com/${psid}?fields=first_name,last_name,picture.type(large)&access_token=${FB_TOKEN}`
    );
    if (profileRes.ok) {
      const profile = await profileRes.json();
      displayName =
        `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
        displayName;
      // Facebook ส่ง picture เป็น object { data: { url: "..." } }
      pictureUrl = profile.picture?.data?.url || "";
    }
  } catch (err) {
    console.error("FB profile fetch error:", err.message);
  }

  // ค้นหา channel_id ของ Facebook ที่ active อยู่
  const [fbChannels] = await db.query(
    "SELECT id FROM channels WHERE platform = 'facebook' AND status = 'active' LIMIT 1"
  );
  const channelId = fbChannels.length > 0 ? fbChannels[0].id : null;

  await db.query(
    "INSERT INTO customers (platform, platform_id, cus_name, cus_picture, channel_id) VALUES ('facebook', ?, ?, ?, ?)",
    [psid, displayName, pictureUrl, channelId]
  );

  const [rows] = await db.query(
    "SELECT cus_id FROM customers WHERE platform = 'facebook' AND platform_id = ?",
    [psid]
  );

  console.log(
    `👤 สร้างลูกค้า Facebook ใหม่: ${displayName} (cus_id: ${rows[0].cus_id})`
  );

  return {
    customerId: rows[0].cus_id,
    displayName,
    pictureUrl,
    isNew: true,
  };
}

// บันทึก Log + สร้าง/อัพเดท Notification แบบ async (fire-and-forget)
// — โครงสร้างเดียวกับ lineController.js
function processLogAndNotification(
  io,
  { customerId, displayName, pictureUrl, logAction, logDetails, msgType, msgContent }
) {
  (async () => {
    // บันทึก Log
    try {
      const logData = {
        user: displayName,
        avatar: pictureUrl || null,
        action: logAction,
        target: "Facebook",
        details: logDetails,
      };
      const logResult = await Log.create(logData);
      if (io) {
        io.emit("new-log", {
          ...logData,
          log_id: logResult.insertId,
          created_at: getLocalDatetime(),
        });
      }
    } catch (logErr) {
      console.error("FB chat log error:", logErr.message);
    }

    // สร้าง/อัพเดท Notification
    try {
      const [allUsers] = await db.query("SELECT emp_id FROM EMP");
      const newNotifications = [];
      const updatedNotifications = [];

      await Promise.all(
        allUsers.map(async (user) => {
          const receiverId = user.emp_id;
          const existingNotif = await Notification.findUnreadByCustomer(
            customerId,
            receiverId
          );

          if (existingNotif) {
            const newMessage = {
              type: msgType,
              content: msgContent,
              timestamp: getLocalDatetime(),
            };
            await Notification.updateWithNewMessage(existingNotif.id, newMessage);

            const updatedNotif = await Notification.getById(existingNotif.id);
            updatedNotif.customer_name = displayName;
            updatedNotif.customer_avatar = pictureUrl;
            updatedNotifications.push(updatedNotif);
          } else {
            const initialMessages = [
              {
                type: msgType,
                content: msgContent,
                timestamp: getLocalDatetime(),
              },
            ];

            const notifData = {
              text: JSON.stringify(initialMessages),
              sender_id: null,
              receiver_id: receiverId,
              type: "customer_message",
              ref_id: customerId,
              ref_type: "customer_message",
            };

            const notifResult = await Notification.create(notifData);
            newNotifications.push({
              ...notifData,
              id: notifResult.insertId,
              created_at: getLocalDatetime(),
              sender_name: displayName,
              customer_name: displayName,
              customer_avatar: pictureUrl,
            });
          }
        })
      );

      if (io) {
        if (newNotifications.length > 0) {
          console.log(`📢 FB new-notifications: ${newNotifications.length} entries`);
          io.emit("new-notifications", newNotifications);
        }
        if (updatedNotifications.length > 0) {
          console.log(`📢 FB update-notifications: ${updatedNotifications.length} entries`);
          io.emit("update-notifications", updatedNotifications);
        }
      }
    } catch (notifErr) {
      console.error("❌ FB notification error:", notifErr.message);
    }
  })();
}
