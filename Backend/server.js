const line = require("@line/bot-sdk");
const express = require("express");
const fs = require("fs");
const path = require("path");
const db = require("./config/db.js");

const dotenv = require("dotenv");
dotenv.config();

// 1. ตั้งค่า Config (ต้องอยู่ก่อน Client เสมอ)
const config = {
  // แนะนำให้เช็คชื่อตัวแปรในไฟล์ .env ให้ตรงกับตรงนี้นะครับ
  channelAccessToken: process.env.Channel_ID, // ปกติมักจะตั้งชื่อว่า CHANNEL_ACCESS_TOKEN
  channelSecret: process.env.channelSecret,
};

const client = new line.Client(config);
const app = express();

// 2. อนุญาตให้ Frontend เข้าถึงไฟล์ในโฟลเดอร์ uploads เพื่อดึงรูปไปแสดง
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// สร้างโฟลเดอร์ uploads อัตโนมัติถ้ายังไม่มี (กัน Error)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// -----------------------------------------------------

// Route สำหรับรับ Webhook
app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).send("OK"))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  // ป้องกัน Error กรณีข้อมูลส่งมาไม่ครบ
  if (!event.source || !event.source.userId) return null;

  const userId = event.source.userId;

  try {
    // ==============================================
    // 1. จัดการข้อมูลลูกค้า (Profile) ลงตาราง customers
    // ==============================================
    const profile = await client.getProfile(userId);
    const displayName = profile.displayName;
    const pictureUrl = profile.pictureUrl || "";

    const userSql = `
      INSERT INTO customers (platform, platform_id, display_name, picture_url) 
      VALUES ('line', ?, ?, ?) 
      ON DUPLICATE KEY UPDATE display_name = ?, picture_url = ?
    `;
    await db.query(userSql, [userId, displayName, pictureUrl, displayName, pictureUrl]);

    // ดึง customer_id ของลูกค้าคนนี้กลับมา เพื่อเอาไปผูกกับข้อความแชท
    const [rows] = await db.query("SELECT id FROM customers WHERE platform = 'line' AND platform_id = ?", [userId]);
    const customerId = rows[0].id;

    // ==============================================
    // 2. จัดการข้อความแชท (Text, Image, Sticker) ลงตาราง chat_messages
    // ==============================================
    if (event.type === "message") {
      
      // กรณีเป็น "ข้อความทั่วไป"
      if (event.message.type === "text") {
        const text = event.message.text;
        const msgSql = "INSERT INTO chat_messages (customer_id, message_type, message_text) VALUES (?, 'text', ?)";
        await db.query(msgSql, [customerId, text]);
        console.log(`บันทึกข้อความ: ${text}`);
      } 
      
      // กรณีเป็น "รูปภาพ"
      else if (event.message.type === "image") {
        const messageId = event.message.id;
        console.log(`กำลังดาวน์โหลดรูปภาพ ID: ${messageId}...`);

        const stream = await client.getMessageContent(messageId);
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const filename = `${messageId}.jpg`;
        const filepath = path.join(__dirname, "uploads", filename);

        // บันทึกไฟล์ลงโฟลเดอร์ uploads
        fs.writeFileSync(filepath, buffer);
        console.log(`บันทึกรูปภาพสำเร็จ: ${filename}`);

        // บันทึกแค่ "ชื่อไฟล์" ลง Database (กำหนดประเภทเป็น image)
        const msgSql = "INSERT INTO chat_messages (customer_id, message_type, message_text) VALUES (?, 'image', ?)";
        await db.query(msgSql, [customerId, filename]);
      } 
      
      // กรณีเป็น "สติกเกอร์"
      else if (event.message.type === "sticker") {
        const stickerId = event.message.stickerId;
        const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`;
        
        // บันทึก URL สติกเกอร์ลง Database (กำหนดประเภทเป็น sticker)
        const msgSql = "INSERT INTO chat_messages (customer_id, message_type, message_text) VALUES (?, 'sticker', ?)";
        await db.query(msgSql, [customerId, stickerUrl]);
        console.log(`บันทึกสติกเกอร์สำเร็จ!`);
      }
    }

  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
  }
}

app.listen(3000, () => console.log("Server is running on port 3000"));