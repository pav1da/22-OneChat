const express = require("express");
const line = require("@line/bot-sdk");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

// นำเข้า Controller ที่เราเพิ่งแยกไฟล์ไว้
const lineController = require("./controllers/lineController");

const app = express();

const config = {
  channelAccessToken: process.env.Channel_ID,
  channelSecret: process.env.channelSecret,
};

// อนุญาตให้ดึงรูปจากโฟลเดอร์ uploads ไปแสดงผล
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ตรวจสอบและสร้างโฟลเดอร์ uploads อัตโนมัติถ้ายังไม่มี
const uploadDir = path.join(__dirname, "uploads");
const chatImagesDir = path.join(__dirname, "uploads", "chat-images");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(chatImagesDir)) {
  fs.mkdirSync(chatImagesDir);
}

// Route สำหรับรับ Webhook จาก LINE
// พอรับข้อมูลมาเสร็จ จะโยนไปให้ฟังก์ชัน handleWebhook ใน lineController จัดการต่อ
app.post("/webhook", line.middleware(config), lineController.handleWebhook);

// เปิดเซิร์ฟเวอร์
app.listen(3000, () => console.log("Server is running on port 3000"));
