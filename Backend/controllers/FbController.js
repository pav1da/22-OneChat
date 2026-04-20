const db = require("../config/db.js");
const Log = require("../models/log.js");
const Notification = require("../models/notification.js");
const cloudinary = require("../config/cloudinary.js");

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

// ===== ส่ง Carousel ไปยัง Facebook Messenger (แบบสไลด์ Generic Template) =====
exports.sendCarouselMessage = async (recipientPsid, cards) => {
  try {
    const normalCards = cards.filter((c) => !c.isEndCard && c.image && c.image.startsWith("http"));
    const endCard = cards.find((c) => c.isEndCard);

    if (normalCards.length === 0) {
      // ถ้าไม่มีการ์ดปกติเลย แต่มี endCard ก็ให้ส่งเป็นข้อความธรรมดาแทน
      if (endCard && endCard.message) {
        return exports.sendTextMessage(recipientPsid, endCard.message);
      }
      return false;
    }

    // สร้าง elements จากการ์ดสูงสุด 10 ใบ
    const elements = normalCards.slice(0, 10).map((c, index) => {
      // Facebook บังคับให้ต้องมี title ใน Generic Template
      const title = c.tag ? c.tag : (c.message ? c.message.substring(0, 80) : `รูปภาพที่ ${index + 1}`);
      const subtitle = (!c.tag && c.message) ? undefined : (c.message ? c.message.substring(0, 80) : undefined);
      
      return {
        title: title.substring(0, 80),
        subtitle: subtitle,
        image_url: c.image
        // ปิดระบบ: เอากล่อง default_action ออก ลูกค้าจะได้กดที่ตัวรูปภาพแล้วไม่เด้งขึ้นมาขยายเต็มจอ
      };
    });

    // ส่งชุด Generic Template (Carousel Swipe) แบบก้อนเดียว
    const carouselPayload = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elements
        }
      }
    };

    const isSuccess = await exports.sendMessage(recipientPsid, carouselPayload);

    // ถ้ามีการ์ดสรุปปิดท้าย (ดูเพิ่มเติม) ให้ส่งตามหลัง
    if (isSuccess && endCard && endCard.message) {
      if (endCard.link) {
        let fbUrl = endCard.link.trim();
        if (!fbUrl.startsWith("http://") && !fbUrl.startsWith("https://")) {
            fbUrl = "https://" + fbUrl;
        }
        
        // ถ้าระบุลิงก์ ให้ส่งเป็น Facebook Button Template เพื่อมีปุ่มลิงก์สี่เหลี่ยมแนบไป
        const buttonPayload = {
          attachment: {
            type: "template",
            payload: {
              template_type: "button",
              text: "➡️ " + endCard.message.substring(0, 640), // FB จำกัดข้อความข้างบนปุ่ม
              buttons: [
                {
                  type: "web_url",
                  url: fbUrl,
                  title: "คลิกเพื่อดูรายละเอียด"
                }
              ]
            }
          }
        };
        await exports.sendMessage(recipientPsid, buttonPayload);
      } else {
        // ถ้าไม่มีลิงก์ ก็ส่งข้อความสรุปเป็น Text ธรรมดา
        await exports.sendTextMessage(recipientPsid, `➡️ ${endCard.message}`);
      }
    }

    console.log(`📤 ส่ง Carousel แบบ Slide ให้ FB (PSID: ${recipientPsid}) สำเร็จ (${elements.length} ใบ)`);
    return isSuccess;
  } catch (err) {
    console.error("FB sendCarouselMessage error:", err.message);
    return false;
  }
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

  // ===== ดึงชื่อ + รูปโปรไฟล์จาก Facebook =====
  let displayName = `FB User ${psid}`;
  let fbPictureUrl = "";
  let pictureUrl = "";

  // วิธีที่ 1: ลองดึงจาก Profile API โดยตรง
  try {
    const profileRes = await fetch(
      `https://graph.facebook.com/${psid}?fields=first_name,last_name,profile_pic&access_token=${FB_TOKEN}`
    );
    if (profileRes.ok) {
      const profile = await profileRes.json();
      if (!profile.error) {
        displayName =
          `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
          displayName;
        fbPictureUrl = profile.profile_pic || "";
        console.log(`👤 FB Profile (direct): ${displayName}`);
      }
    }
  } catch (err) {
    console.error("FB profile direct error:", err.message);
  }

  // วิธีที่ 2: ถ้ายังเป็นชื่อ default → ดึงจาก Conversations API (ใช้ได้แม้ไม่มี pages_read_engagement)
  if (displayName === `FB User ${psid}`) {
    try {
      console.log("🔄 Fallback: ดึงชื่อจาก Conversations API...");
      const convRes = await fetch(
        `https://graph.facebook.com/v19.0/me/conversations?fields=participants&access_token=${FB_TOKEN}`
      );
      if (convRes.ok) {
        const convData = await convRes.json();
        // ค้นหา PSID ใน participants ของทุก conversation
        for (const conv of (convData.data || [])) {
          const participant = conv.participants?.data?.find((p) => p.id === psid);
          if (participant && participant.name) {
            displayName = participant.name;
            console.log(`👤 FB Profile (conversations): ${displayName}`);
            break;
          }
        }
      }
    } catch (err) {
      console.error("FB conversations fallback error:", err.message);
    }
  }

  // ===== ดึงรูปโปรไฟล์ + Upload ไป Cloudinary =====
  // ลอง Facebook CDN redirect URL
  if (!fbPictureUrl) {
    try {
      const picRes = await fetch(
        `https://graph.facebook.com/${psid}/picture?type=large&redirect=false&access_token=${FB_TOKEN}`
      );
      if (picRes.ok) {
        const picData = await picRes.json();
        if (picData.data && picData.data.url && !picData.data.is_silhouette) {
          fbPictureUrl = picData.data.url;
        }
      }
    } catch (err) {
      // ดึงรูปไม่ได้ — ใช้ fallback avatar
    }
  }

  if (fbPictureUrl) {
    try {
      const uploadResult = await cloudinary.uploader.upload(fbPictureUrl, {
        folder: "onechat/fb-profiles",
        public_id: `fb_${psid}`,
        overwrite: true,
        transformation: [
          { width: 200, height: 200, crop: "fill", gravity: "face" },
        ],
      });
      pictureUrl = uploadResult.secure_url;
      console.log(`☁️ Upload รูป FB ไป Cloudinary สำเร็จ: ${pictureUrl}`);
    } catch (uploadErr) {
      console.error("Cloudinary upload error:", uploadErr.message);
      pictureUrl = fbPictureUrl; // Fallback
    }
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

// ===== Sync ประวัติแชทเก่าจาก Facebook =====
// ดึง conversations ทั้งหมดจาก Facebook Page แล้วบันทึกลง DB
exports.syncConversationHistory = async (req, res) => {
  const PAGE_ACCESS_TOKEN = process.env.FB_TOKEN;

  try {
    // 1. ดึง Page ID ก่อน
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?access_token=${PAGE_ACCESS_TOKEN}`
    );
    if (!meRes.ok) {
      const err = await meRes.json();
      return res.status(400).json({ message: "FB Token ไม่ถูกต้อง", error: err });
    }
    const pageInfo = await meRes.json();
    const pageId = pageInfo.id;
    console.log(`📄 Facebook Page: ${pageInfo.name} (ID: ${pageId})`);

    // 2. ดึง Conversations ทั้งหมดของ Page
    let conversations = [];
    let convUrl = `https://graph.facebook.com/v19.0/${pageId}/conversations?fields=id,participants,updated_time&limit=25&access_token=${PAGE_ACCESS_TOKEN}`;

    while (convUrl) {
      const convRes = await fetch(convUrl);
      if (!convRes.ok) {
        const err = await convRes.json();
        console.error("FB conversations error:", err);
        break;
      }
      const convData = await convRes.json();
      conversations = conversations.concat(convData.data || []);
      convUrl = convData.paging?.next || null;
    }

    console.log(`💬 พบ ${conversations.length} conversations`);

    let totalNewMessages = 0;
    let totalNewCustomers = 0;

    // 3. วนแต่ละ conversation → ดึงข้อความ
    for (const conv of conversations) {
      // หา participant ที่ไม่ใช่ Page (= ลูกค้า)
      const customer = conv.participants?.data?.find((p) => p.id !== pageId);
      if (!customer) continue;

      const senderPsid = customer.id;

      // สร้างหรือค้นหาลูกค้าใน DB
      const { customerId, isNew } = await findOrCreateFbCustomer(senderPsid);
      if (isNew) totalNewCustomers++;

      // 4. ดึงข้อความจาก conversation นี้
      let msgUrl = `https://graph.facebook.com/v19.0/${conv.id}/messages?fields=message,created_time,from,attachments&limit=100&access_token=${PAGE_ACCESS_TOKEN}`;

      while (msgUrl) {
        const msgRes = await fetch(msgUrl);
        if (!msgRes.ok) {
          console.error(`FB messages error (conv: ${conv.id}):`, await msgRes.json());
          break;
        }
        const msgData = await msgRes.json();
        const fbMessages = msgData.data || [];

        for (const fbMsg of fbMessages) {
          // ตรวจสอบว่าบันทึกไปแล้วหรือยัง (ใช้ created_time เทียบ)
          const createdAt = new Date(fbMsg.created_time);
          const mysqlTime = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}-${String(createdAt.getDate()).padStart(2, "0")} ${String(createdAt.getHours()).padStart(2, "0")}:${String(createdAt.getMinutes()).padStart(2, "0")}:${String(createdAt.getSeconds()).padStart(2, "0")}`;

          // ระบุว่าเป็นข้อความจากลูกค้าหรือจาก Page
          const sender = fbMsg.from?.id === pageId ? "own" : "customer";

          // ข้อความ text
          if (fbMsg.message) {
            // เช็คว่ามีข้อความซ้ำในเวลาเดียวกันหรือไม่
            const [existing] = await db.query(
              "SELECT id FROM chat_messages WHERE customer_id = ? AND message_text = ? AND created_at = ?",
              [customerId, fbMsg.message, mysqlTime]
            );

            if (existing.length === 0) {
              await db.query(
                "INSERT INTO chat_messages (customer_id, sender, message_type, message_text, created_at) VALUES (?, ?, 'text', ?, ?)",
                [customerId, sender, fbMsg.message, mysqlTime]
              );
              totalNewMessages++;
            }
          }

          // รูปภาพ / attachments
          if (fbMsg.attachments?.data) {
            for (const att of fbMsg.attachments.data) {
              if (att.image_data?.url || att.file_url) {
                const imgUrl = att.image_data?.url || att.file_url;
                const isSticker = att.type === "sticker";
                const msgType = isSticker ? "sticker" : "image";

                const [existing] = await db.query(
                  "SELECT id FROM chat_messages WHERE customer_id = ? AND message_text = ? AND created_at = ?",
                  [customerId, imgUrl, mysqlTime]
                );

                if (existing.length === 0) {
                  await db.query(
                    "INSERT INTO chat_messages (customer_id, sender, message_type, message_text, created_at) VALUES (?, ?, ?, ?, ?)",
                    [customerId, sender, msgType, imgUrl, mysqlTime]
                  );
                  totalNewMessages++;
                }
              }
            }
          }
        }

        // Pagination — ดึงหน้าถัดไป
        msgUrl = msgData.paging?.next || null;
      }
    }

    console.log(`✅ Sync เสร็จ! ลูกค้าใหม่: ${totalNewCustomers}, ข้อความใหม่: ${totalNewMessages}`);

    res.json({
      message: "Sync ประวัติแชท Facebook สำเร็จ",
      page: pageInfo.name,
      conversations: conversations.length,
      newCustomers: totalNewCustomers,
      newMessages: totalNewMessages,
    });
  } catch (err) {
    console.error("❌ Sync FB history error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการ sync", error: err.message });
  }
};
