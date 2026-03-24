const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const line = require("@line/bot-sdk");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const setupSwagger = require("./config/swagger.js");

dotenv.config();

// ===== LINE Webhook Middleware Config =====
const lineMiddlewareConfig = {
  channelSecret: process.env.channelSecret,
};

// นำเข้า Controller
const lineController = require("./controllers/lineController.js");

// นำเข้า Routers
const usersRouter = require("./routers/usersRouter.js");
const logsRouter = require("./routers/logsRouter.js");
const notificationRouter = require("./routers/notificationRouter.js");
const customersRouter = require("./routers/customersRouter.js");
const messagesRouter = require("./routers/messagesRouter.js");
const notesRouter = require("./routers/notesRouter.js");
const notificationSettingsRouter = require("./routers/notificationSettingsRouter.js");
const templatesRouter = require("./routers/templatesRouter.js");
const apiKeysRouter = require("./routers/apiKeysRouter.js");

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

// ===== LINE Webhook =====
app.post("/webhook", (req, res, next) => {
  console.log("🔥 [RADAR] มีข้อมูลวิ่งเข้ามาที่ Webhook แล้ว!");
  next();
}, line.middleware(lineMiddlewareConfig), lineController.handleWebhook);

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

// ===== Swagger =====
setupSwagger(app);

// ===== Routes =====
app.use("/api/users", usersRouter);

app.use("/api/logs", logsRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/notification-settings", notificationSettingsRouter);

app.use("/api/customers", customersRouter);
app.use("/api/messages", messagesRouter);

app.use("/api/notes", notesRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/api-keys", apiKeysRouter);

// เปิดเซิร์ฟเวอร์ (ใช้ server.listen แทน app.listen เพื่อให้ Socket.IO ทำงาน)
// ดึง Port จาก Railway ถ้าไม่มีให้ใช้ 3000 (สำหรับรันในเครื่อง)
const PORT = process.env.PORT || 3000;

// เปิดเซิร์ฟเวอร์
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT} (with Socket.IO)`);
});
