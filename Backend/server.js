const express = require("express");
const cors = require("cors");
const line = require("@line/bot-sdk");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

// นำเข้า Controller
const lineController = require("./controllers/lineController");

// นำเข้า Routers
const usersRouter = require("./routers/usersRouter");
const logsRouter = require('./routers/logsRouter');

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// ===== LINE Config =====
const config = {
    channelAccessToken: process.env.Channel_ID,
    channelSecret: process.env.channelSecret,
};

// ===== Routes =====
// API Routes
app.use("/api/users", usersRouter);

app.use('/api/logs', logsRouter);

// Route สำหรับรับ Webhook จาก LINE
app.post("/webhook", line.middleware(config), lineController.handleWebhook);

// เปิดเซิร์ฟเวอร์
app.listen(3000, () => console.log("Server is running on port 3000"));
