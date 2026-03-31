const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Message = require('../models/message.js');
const Customer = require('../models/customer.js');
const Log = require('../models/log.js');
const { lineClient } = require('../controllers/lineController.js');
const auth = require('../middleware/auth.js');


// Multer config for admin-uploaded chat images
const chatImageStorage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'chat-images'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `admin-${Date.now()}${ext}`);
  },
});
const uploadChatImage = multer({
  storage: chatImageStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});


// POST /api/messages/upload-image — อัปโหลดรูปภาพ แล้วคืน filename
router.post('/upload-image', auth, uploadChatImage.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'ไม่พบไฟล์รูปภาพ' });
  res.json({ filename: req.file.filename, url: `/uploads/chat-images/${req.file.filename}` });
});


// Helper: สร้างวันที่เวลาแบบ MySQL format
const getLocalDatetime = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};


/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: จัดการข้อความแชท (Chat Messages)
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     ChatMessage:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         customer_id:
 *           type: integer
 *           example: 1
 *         sender:
 *           type: string
 *           enum: [own, customer]
 *           example: "customer"
 *         message_type:
 *           type: string
 *           enum: [text, image, sticker]
 *           example: "text"
 *         message_text:
 *           type: string
 *           example: "สวัสดีครับ"
 *         created_at:
 *           type: string
 *           example: "2026-03-24 19:00:00"
 */


/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: ดึงข้อความทั้งหมด (จัดกลุ่มตาม customer_id)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ — Object โดย key = customer_id, value = array ของข้อความ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     sender:
 *                       type: string
 *                     message_type:
 *                       type: string
 *                     text:
 *                       type: string
 *                       nullable: true
 *                     image:
 *                       type: string
 *                       nullable: true
 *                     created_at:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/messages/{customerId}:
 *   get:
 *     summary: ดึงข้อความของลูกค้ารายเดียว
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: ส่งข้อความใหม่ (จาก dashboard ไปหาลูกค้า + ส่งต่อไปยัง LINE อัตโนมัติ)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [customer_id, message_text]
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               sender:
 *                 type: string
 *                 enum: [own, customer]
 *                 default: "own"
 *                 example: "own"
 *               message_type:
 *                 type: string
 *                 enum: [text, image]
 *                 default: "text"
 *                 example: "text"
 *               message_text:
 *                 type: string
 *                 example: "สวัสดีครับ ยินดีให้บริการ"
 *               socket_id:
 *                 type: string
 *                 nullable: true
 *                 description: Socket ID ของ client ที่ส่ง (เพื่อข้าม broadcast กลับไปหาตัวเอง)
 *     responses:
 *       201:
 *         description: ส่งข้อความสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ส่งข้อความสำเร็จ"
 *                 id:
 *                   type: integer
 *                   example: 42
 *       400:
 *         description: กรุณาระบุ customer_id และข้อความ
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */


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


// POST /api/messages — ส่งข้อความใหม่ + ส่งไปยัง LINE ถ้าเป็นข้อความจาก dashboard
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


    // ถ้าเป็นข้อความจาก dashboard (own) ให้ส่งไปยัง LINE ด้วย
    if ((sender || 'own') === 'own') {
      try {
        const customer = await Customer.findById(customer_id);
        if (customer && customer.platform === 'line' && customer.platform_id) {
          const lineMessages = [];
          if ((message_type || 'text') === 'text') {
            lineMessages.push({ type: 'text', text: message_text });
          } else if (message_type === 'image') {
            const backendUrl = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');
            const imageAbsUrl = `${backendUrl}/uploads/chat-images/${message_text}`;
            lineMessages.push({
              type: 'image',
              originalContentUrl: imageAbsUrl,
              previewImageUrl: imageAbsUrl,
            });
          }
          if (lineMessages.length > 0) {
            await lineClient.pushMessage({
              to: customer.platform_id,
              messages: lineMessages,
            });
            console.log(`📤 ส่งข้อความไปยัง LINE (${customer.display_name}) สำเร็จ`);
          }
        }
      } catch (lineErr) {
        console.error('LINE push message error:', lineErr);
      }
    }


    // ส่ง real-time event ผ่าน Socket.IO
    const io = req.app.get('io');
    if (io) {
      const senderSocketId = req.body.socket_id;
      const msgPayload = { id: newId, customer_id, sender: sender || 'own', message_type: message_type || 'text', text: (message_type || 'text') === 'text' ? message_text : null, image: (message_type === 'image') ? message_text : null, created_at: getLocalDatetime() };
      if (senderSocketId) {
        // ส่งให้ทุกคนยกเว้นคนส่ง (เพราะคนส่งทำ optimistic update ไปแล้ว)
        io.except(senderSocketId).emit('new-message', msgPayload);
      } else {
        io.emit('new-message', msgPayload);
      }
    }


    // บันทึก Log การส่งข้อความจาก dashboard
    if ((sender || 'own') === 'own') {
      try {
        const customer = await Customer.findById(customer_id);
        const customerName = customer?.display_name || `Customer #${customer_id}`;
        const adminName = req.user?.username || 'unknown';
        const msgPreview = (message_type || 'text') === 'text'
          ? (message_text.length > 50 ? message_text.substring(0, 50) + '...' : message_text)
          : '(รูปภาพ)';


        const logData = {
          user: adminName,
          avatar: null,
          action: 'ส่งข้อความ',
          target: customerName,
          details: msgPreview,
        };
        const logResult = await Log.create(logData);
        const io = req.app.get('io');
        if (io) {
          io.emit('new-log', { ...logData, log_id: logResult.insertId, created_at: getLocalDatetime() });
        }
      } catch (logErr) {
        console.error('Chat log error:', logErr.message);
      }
    }


    res.status(201).json({ message: 'ส่งข้อความสำเร็จ', id: newId });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความ' });
  }
});


module.exports = router;



