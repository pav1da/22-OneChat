const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const db = require("../config/db.js");
const Log = require("../models/log.js");
const Notification = require("../models/notification.js");

const channelAccessToken = process.env.Channel_ID;
const channelSecret = process.env.channelSecret;

// สร้าง Client ของ LINE (v10 API)
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken });
const blobClient = new line.messagingApi.MessagingApiBlobClient({ channelAccessToken });

// Helper: สร้างวันที่เวลาแบบ MySQL format
const getLocalDatetime = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// รับข้อมูลจาก Route แล้วแยกกระจายงาน
exports.handleWebhook = (req, res) => {
  console.log("📩 รับข้อมูลจาก LINE แล้ว!");
  const io = req.app.get("io");
  Promise.all(req.body.events.map((event) => handleEvent(event, io)))
    .then(() => res.status(200).send("OK"))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
};

async function handleEvent(event, io) {
  if (!event.source || !event.source.userId) return null;

  const userId = event.source.userId;

  try {
    // ตรวจสอบว่าลูกค้าเคยมีอยู่แล้วหรือยัง (ใช้ cache จาก DB เพื่อลด API call)
    const [existingRows] = await db.query(
      "SELECT id, display_name, picture_url, updated_at FROM customers WHERE platform = 'line' AND platform_id = ?",
      [userId],
    );
    const isNewCustomer = existingRows.length === 0;

    let displayName, pictureUrl, customerId;

    if (isNewCustomer) {
      // ลูกค้าใหม่ → เรียก LINE API ดึงโปรไฟล์
      const profile = await client.getProfile(userId);
      displayName = profile.displayName;
      pictureUrl = profile.pictureUrl || "";

      await db.query(
        `INSERT INTO customers (platform, platform_id, display_name, picture_url) VALUES ('line', ?, ?, ?)`,
        [userId, displayName, pictureUrl]
      );
      const [rows] = await db.query(
        "SELECT id FROM customers WHERE platform = 'line' AND platform_id = ?",
        [userId],
      );
      customerId = rows[0].id;

      if (io) {
        io.emit("new-customer", {
          id: customerId,
          display_name: displayName,
          picture_url: pictureUrl,
          platform: "line",
          platform_id: userId,
        });
      }
    } else {
      // ลูกค้าเก่า → ใช้ข้อมูลจาก DB (ไม่ต้องเรียก LINE API)
      customerId = existingRows[0].id;
      displayName = existingRows[0].display_name;
      pictureUrl = existingRows[0].picture_url || "";

      // อัพเดทโปรไฟล์ทุก 24 ชม. (fire-and-forget ไม่ block)
      const lastUpdate = new Date(existingRows[0].updated_at);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate >= 24) {
        refreshCustomerProfile(customerId, userId, io).then(({ name, pic }) => {
          displayName = name;
          pictureUrl = pic;
        }).catch(() => {});
      }
    }

    // ตรวจสอบและบันทึกข้อความลงตาราง chat_messages
    if (event.type === "message") {
      // Text (ข้อความ)
      if (event.message.type === "text") {
        const text = event.message.text;
        const msgSql =
          "INSERT INTO chat_messages (customer_id, sender, message_type, message_text) VALUES (?, 'customer', 'text', ?)";
        const [result] = await db.query(msgSql, [customerId, text]);
        console.log(`บันทึกข้อความ: ${text}`);

        // ส่ง real-time ไป Frontend ทันที (ไม่ต้องรอ log/notification)
        if (io) {
          io.emit("new-message", {
            id: result.insertId,
            customer_id: customerId,
            sender: "customer",
            text: text,
            image: null,
          });
        }

        // Fire-and-forget: บันทึก Log + Notification แบบ async (ไม่ block)
        processLogAndNotification(io, {
          customerId, displayName, pictureUrl,
          logAction: "ส่งข้อความเข้ามา",
          logDetails: text.length > 50 ? text.substring(0, 50) + "..." : text,
          msgType: "text",
          msgContent: text.length > 30 ? text.substring(0, 30) + "..." : text,
        });
      }

      // Image (รูปภาพ)
      else if (event.message.type === "image") {
        const messageId = event.message.id;
        const stream = await blobClient.getMessageContent(messageId);
        const chunks = [];

        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const filename = `${messageId}.jpg`;
        const filepath = path.join(
          __dirname,
          "../uploads/chat-images",
          filename,
        );

        fs.writeFileSync(filepath, buffer);
        console.log(`บันทึกรูปภาพสำเร็จ: ${filename}`);

        const msgSql =
          "INSERT INTO chat_messages (customer_id, sender, message_type, message_text) VALUES (?, 'customer', 'image', ?)";
        const [result] = await db.query(msgSql, [customerId, filename]);

        // ส่ง real-time ไป Frontend ทันที
        if (io) {
          io.emit("new-message", {
            id: result.insertId,
            customer_id: customerId,
            sender: "customer",
            text: null,
            image: `/uploads/chat-images/${filename}`,
          });
        }

        // Fire-and-forget: Log + Notification
        processLogAndNotification(io, {
          customerId, displayName, pictureUrl,
          logAction: "ส่งรูปภาพเข้ามา",
          logDetails: filename,
          msgType: "image",
          msgContent: "รูปภาพ",
        });
      }
     

      // Sticker (สติกเกอร์)
      else if (event.message.type === "sticker") {
        const stickerId = event.message.stickerId;
        const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`;

        const msgSql =
          "INSERT INTO chat_messages (customer_id, sender, message_type, message_text) VALUES (?, 'customer', 'sticker', ?)";
        const [result] = await db.query(msgSql, [customerId, stickerUrl]);
        console.log(`บันทึกสติกเกอร์สำเร็จ!`);

        // ส่ง real-time ไป Frontend ทันที
        if (io) {
          io.emit("new-message", {
            id: result.insertId,
            customer_id: customerId,
            sender: "customer",
            message_type: "sticker",
            text: null,
            image: stickerUrl,
          });
        }

        // Fire-and-forget: Log + Notification
        processLogAndNotification(io, {
          customerId, displayName, pictureUrl,
          logAction: "ส่งสติกเกอร์เข้ามา",
          logDetails: `Sticker ID: ${stickerId}`,
          msgType: "sticker",
          msgContent: "สติกเกอร์",
        });
      }
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
  }
}

// Helper: อัพเดทโปรไฟล์ลูกค้าจาก LINE API (ทุก 24 ชม.)
async function refreshCustomerProfile(customerId, lineUserId, io) {
  const profile = await client.getProfile(lineUserId);
  const name = profile.displayName;
  const pic = profile.pictureUrl || "";
  await db.query(
    "UPDATE customers SET display_name = ?, picture_url = ?, updated_at = NOW() WHERE id = ?",
    [name, pic, customerId]
  );
  console.log(`Profile refreshed: ${name}`);
  return { name, pic };
}

// Helper: บันทึก Log + สร้าง/อัพเดท Notification แบบ async (fire-and-forget)
function processLogAndNotification(io, { customerId, displayName, pictureUrl, logAction, logDetails, msgType, msgContent }) {
  (async () => {
    // บันทึก Log
    try {
      const logData = {
        user: displayName,
        avatar: pictureUrl || null,
        action: logAction,
        target: "LINE",
        details: logDetails,
      };
      const logResult = await Log.create(logData);
      if (io) {
        io.emit("new-log", { ...logData, log_id: logResult.insertId, created_at: getLocalDatetime() });
      }
    } catch (logErr) {
      console.error("Chat log error:", logErr.message);
    }

    // สร้าง/อัพเดท Notification (ใช้ Promise.all แทน sequential loop)
    try {
      const [allUsers] = await db.query("SELECT emp_id FROM EMP");
      const newNotifications = [];
      const updatedNotifications = [];

      await Promise.all(allUsers.map(async (user) => {
        const receiverId = user.emp_id;
        const existingNotif = await Notification.findUnreadByCustomer(customerId, receiverId);

        if (existingNotif) {
          const newMessage = {
            type: msgType,
            content: msgContent,
            timestamp: getLocalDatetime()
          };
          await Notification.updateWithNewMessage(existingNotif.id, newMessage);

          const updatedNotif = await Notification.getById(existingNotif.id);
          updatedNotif.customer_name = displayName;
          updatedNotif.customer_avatar = pictureUrl;
          updatedNotifications.push(updatedNotif);
        } else {
          const initialMessages = [{
            type: msgType,
            content: msgContent,
            timestamp: getLocalDatetime()
          }];

          const notifData = {
            text: JSON.stringify(initialMessages),
            sender_id: null,
            receiver_id: receiverId,
            type: "customer_message",
            ref_id: customerId,
            ref_type: "customer_message"
          };

          const notifResult = await Notification.create(notifData);
          newNotifications.push({
            ...notifData,
            id: notifResult.insertId,
            created_at: getLocalDatetime(),
            sender_name: displayName,
            customer_name: displayName,
            customer_avatar: pictureUrl
          });
        }
      }));

      if (io) {
        if (newNotifications.length > 0) {
          console.log(`📢 Emitting new-notifications: ${newNotifications.length} entries`);
          io.emit("new-notifications", newNotifications);
        }
        if (updatedNotifications.length > 0) {
          console.log(`📢 Emitting update-notifications: ${updatedNotifications.length} entries`);
          io.emit("update-notifications", updatedNotifications);
        }
      }
    } catch (notifErr) {
      console.error("❌ Notification error:", notifErr.message);
    }
  })();
}

// Export LINE client เพื่อให้ module อื่นใช้ส่งข้อความกลับไปยัง LINE ได้
exports.lineClient = client;
