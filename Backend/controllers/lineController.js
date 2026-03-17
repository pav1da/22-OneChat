const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const db = require("../config/db.js");

const config = {
  channelAccessToken: process.env.Channel_ID,
  channelSecret: process.env.channelSecret,
};

// สร้าง Client ของ LINE
const client = new line.Client(config);

// รับข้อมูลจาก Route แล้วแยกกระจายงาน
exports.handleWebhook = (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).send("OK"))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
};

// แกะกล่องข้อมูล และบันทึกลง Database
async function handleEvent(event) {
  if (!event.source || !event.source.userId) return null;

  const userId = event.source.userId;

  try {
    // ดึงโปรไฟล์ลูกค้าและบันทึกลงตาราง customers
    const profile = await client.getProfile(userId);
    const displayName = profile.displayName;
    const pictureUrl = profile.pictureUrl || "";

    const userSql = `
      INSERT INTO customers (platform, platform_id, display_name, picture_url) 
      VALUES ('line', ?, ?, ?) 
      ON DUPLICATE KEY UPDATE display_name = ?, picture_url = ?
    `;
    await db.query(userSql, [
      userId,
      displayName,
      pictureUrl,
      displayName,
      pictureUrl,
    ]);

    // ดึง id ลูกค้ากลับมาเพื่อผูกกับแชท
    const [rows] = await db.query(
      "SELECT id FROM customers WHERE platform = 'line' AND platform_id = ?",
      [userId],
    );
    const customerId = rows[0].id;

    // ตรวจสอบและบันทึกข้อความลงตาราง chat_messages
    if (event.type === "message") {
      // Text (ข้อความ)
      if (event.message.type === "text") {
        const text = event.message.text;
        const msgSql =
          "INSERT INTO chat_messages (customer_id, message_type, message_text) VALUES (?, 'text', ?)";
        await db.query(msgSql, [customerId, text]);
        console.log(`บันทึกข้อความ: ${text}`);
      }

      // Image (รูปภาพ)
      else if (event.message.type === "image") {
        const messageId = event.message.id;
        const stream = await client.getMessageContent(messageId);
        const chunks = [];

        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        const filename = `${messageId}.jpg`;
        // เปลี่ยนให้บันทึกลงไปในโฟลเดอร์ chat-images
        const filepath = path.join(
          __dirname,
          "../uploads/chat-images",
          filename,
        );

        fs.writeFileSync(filepath, buffer);
        console.log(`บันทึกรูปภาพสำเร็จ: ${filename}`);

        const msgSql =
          "INSERT INTO chat_messages (customer_id, message_type, message_text) VALUES (?, 'image', ?)";
        await db.query(msgSql, [customerId, filename]);
      }

      // Sticker (สติกเกอร์)
      else if (event.message.type === "sticker") {
        const stickerId = event.message.stickerId;
        const stickerUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`;

        const msgSql =
          "INSERT INTO chat_messages (customer_id, message_type, message_text) VALUES (?, 'sticker', ?)";
        await db.query(msgSql, [customerId, stickerUrl]);
        console.log(`บันทึกสติกเกอร์สำเร็จ!`);
      }
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
  }
}
