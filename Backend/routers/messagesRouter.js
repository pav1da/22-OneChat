const express = require('express');
const router = express.Router();
const line = require("@line/bot-sdk");
const db = require('../config/db.js');
const Message = require('../models/message.js');
const auth = require('../middleware/auth.js');

const config = {
  channelAccessToken: process.env.Channel_ID,
  channelSecret: process.env.channelSecret,
};
const client = new line.Client(config);

// GET /api/messages — ดึงข้อความทั้งหมด (by customer_id)
router.get('/', auth, async (req, res) => {
  try {
    const grouped = await Message.findAllGrouped();
    res.json(grouped);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อความ' });
  }
});

// GET /api/messages/:customerId — ดึงข้อความของลูกค้า
router.get('/:customerId', auth, async (req, res) => {
  try {
    const messages = await Message.findByCustomerId(req.params.customerId);
    res.json(messages);
  } catch (err) {
    console.error('Get messages by customer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/messages — ส่งข้อความใหม่
router.post('/', auth, async (req, res) => {
  try {
    const { customer_id, sender, message_type, message_text } = req.body;

    if (!customer_id || !message_text) {
      return res.status(400).json({ message: 'กรุณาระบุ customer_id และข้อความ' });
    }

    const newId = await Message.create({
      customer_id,
      sender: sender || 'own',
      message_type: message_type || 'text',
      message_text,
    });

    // ส่ง real-time event ผ่าน Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('new-message', { id: newId, customer_id, sender, message_type, message_text });
    }

    // === ส่งข้อความออกไปที่แอพ LINE ภายนอก ===
    try {
      const [rows] = await db.query("SELECT platform_id FROM customers WHERE id = ?", [customer_id]);
      if (rows.length > 0 && rows[0].platform_id) {
        if (message_type === 'text') {
          await client.pushMessage(rows[0].platform_id, { type: 'text', text: message_text });
        } else if (message_type === 'image') {
          // ถ้าเป็น Image ต้องส่งเป็น URL ที่ public ได้ (อาจต้องใช้ ngrok URL หรือ URL จริงของ Server)
          // เบื้องต้นถ้าเก็บแค่ path ภายใน จะส่งไม่ได้ ต้องใช้ full URL
        } else if (message_type === 'template') {
          try {
            const tmplObj = typeof message_text === 'string' ? JSON.parse(message_text) : message_text;
            const { id, content } = tmplObj;

            if (content) {
              const protocol = req.headers['x-forwarded-proto'] || req.protocol;
              const host = req.headers['x-forwarded-host'] || req.get('host');
              let baseUrl = `${protocol}://${host}`;

              // ใช้ URL สลับไปเป็น ngrok ถ้ามีการเก็บไว้จาก Webhook (LINE บังคับว่าต้องส่งรูปภาพผ่าน https)
              if (global.APP_PUBLIC_URL && global.APP_PUBLIC_URL.startsWith('https')) {
                  baseUrl = global.APP_PUBLIC_URL;
              } else if (baseUrl.startsWith('http://localhost') || baseUrl.startsWith('http://127.0.0.1')) {
                  console.warn("⚠️ Warning: Sending template with localhost URL. LINE will reject this. Please send a message to the bot first to capture the ngrok URL.");
              }
              
              let messagesPayload = [];

              if (content.images && content.images.length > 0) {
                 // ส่งเป็น Image Carousel (เลื่อนซ้ายขวา)
                 const columns = content.images.slice(0, 10).map((img, idx) => {
                     const publicImgUrl = `${baseUrl}/api/templates/image/${id}/${idx}`;
                     return {
                         imageUrl: publicImgUrl,
                         action: {
                             type: 'uri',
                             label: 'ดูรูปภาพ',
                             uri: publicImgUrl
                         }
                     };
                 });

                 messagesPayload.push({
                     type: 'template',
                     altText: tmplObj.name || 'รูปภาพสไลด์',
                     template: {
                         type: 'image_carousel',
                         columns: columns
                     }
                 });
                 if (content.message) {
                     messagesPayload.push({
                         type: 'text',
                         text: content.message
                     });
                 }
              } else if (content.image) {
                 // รูปภาพเดี่ยว
                 const publicImgUrl = `${baseUrl}/api/templates/image/${id}/single`;
                 messagesPayload.push({
                     type: 'image',
                     originalContentUrl: publicImgUrl,
                     previewImageUrl: publicImgUrl
                 });
                 if (content.message) {
                     messagesPayload.push({
                         type: 'text',
                         text: content.message
                     });
                 }
              } else if (content.message) {
                 messagesPayload.push({
                     type: 'text',
                     text: content.message
                 });
              }

              if (messagesPayload.length > 0) {
                 await client.pushMessage(rows[0].platform_id, messagesPayload);
              }
            }
          } catch(e) {
            console.error("Error parsing/sending template:", e);
          }
        }
      }
    } catch(lineErr) {
      console.error("Failed to push message to LINE:", lineErr.message);
    }

    res.status(201).json({ message: 'ส่งข้อความสำเร็จ', id: newId });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
  }
});

module.exports = router;
