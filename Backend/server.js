const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
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
const notificationRouter = require('./routers/notificationRouter');
const notificationSettingsRouter = require('./routers/notificationSettingsRouter');
const templatesRouter = require('./routers/templatesRouter');
const notesRouter = require('./routers/notesRouter');

const app = express();
const server = http.createServer(app);

// ===== Socket.IO =====
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// แชร์ io instance ให้ routers ใช้ได้
app.set("io", io);

io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);
    socket.on("disconnect", () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

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

app.use('/api/notifications', notificationRouter);

app.use('/api/notification-settings', notificationSettingsRouter);

app.use('/api/templates', templatesRouter);

app.use('/api/notes', notesRouter);

// Route สำหรับรับ Webhook จาก LINE
app.post("/webhook", line.middleware(config), lineController.handleWebhook);

// เปิดเซิร์ฟเวอร์ (ใช้ server.listen แทน app.listen เพื่อให้ Socket.IO ทำงาน)
server.listen(3000, () => console.log("Server is running on port 3000 (with Socket.IO)"));

