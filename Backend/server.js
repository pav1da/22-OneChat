const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const line = require("@line/bot-sdk");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const setupSwagger = require("./config/swagger.js");
const pool = require("./config/db.js"); // นำเข้า MySQL connection pool สำหรับอัปเดตสถานะ online/offline

dotenv.config();

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
const channelsRouter = require("./routers/channelsRouter.js");
const teamRouter = require("./routers/teamRouter.js");
const membersRouter = require("./routers/membersRouter.js");
const tagsRouter = require("./routers/tagsRouter.js");

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

// ===== ระบบติดตามสถานะ Online/Offline =====
// ใช้ Map เก็บ emp_id -> Set ของ socket IDs
// เหตุผล: user 1 คนอาจเปิดหลาย tab/device พร้อมกัน → ต้องเก็บหลาย socket ID ต่อ user
// จะถือว่า offline ก็ต่อเมื่อปิด tab/device สุดท้าย (Set ว่าง)
const onlineUsers = new Map();

// เมื่อมี client เชื่อมต่อ Socket.IO เข้ามา
io.on("connection", async (socket) => {
    // ดึง emp_id ที่ frontend ส่งมาผ่าน socket.handshake.auth
    // (frontend ส่งตอนสร้าง connection: io({ auth: { emp_id: ... } }))
    const empId = socket.handshake.auth.emp_id;
    console.log(`🔌 Client connected: ${socket.id}, emp_id: ${empId}`);

    if (empId) {
        // === ขั้นตอนที่ 1: เก็บ socket ID ของ user ใน Map ===
        // ถ้า user คนนี้ยังไม่มีใน Map → สร้าง Set ใหม่
        if (!onlineUsers.has(empId)) {
            onlineUsers.set(empId, new Set());
        }
        // เพิ่ม socket ID ลงใน Set ของ user (รองรับกรณีเปิดหลาย tab)
        onlineUsers.get(empId).add(socket.id);

        // === ขั้นตอนที่ 2: อัปเดต Database ให้ user เป็น online ===
        // เขียนลง column is_online ในตาราง EMP ที่อยู่บน Railway MySQL
        try {
            await pool.query("UPDATE EMP SET is_online = 1 WHERE emp_id = ?", [empId]);
        } catch (err) {
            console.error("Error updating online status:", err.message);
        }

        // === ขั้นตอนที่ 3: Broadcast สถานะ "online" ให้ทุก client ที่เชื่อมต่ออยู่ ===
        // ทุก client จะได้รับ event "user-status-changed" และอัปเดต UI ทันที
        io.emit("user-status-changed", { emp_id: empId, is_online: true });
    }

    // === ขั้นตอนที่ 4: ส่งรายชื่อ user ที่ online อยู่ทั้งหมดให้ client ที่เพิ่งเชื่อมต่อ ===
    // เพื่อให้ client ใหม่รู้ว่าตอนนี้ใครออนไลน์อยู่บ้าง (ไม่ต้องรอ event ทีละคน)
    const currentOnline = Array.from(onlineUsers.keys()).map((id) => ({
        emp_id: id,
        is_online: true,
    }));
    socket.emit("online-users", currentOnline);

    // === เมื่อ client ตัดการเชื่อมต่อ (ปิดแท็บ, logout, หรือเน็ตหลุด) ===
    socket.on("disconnect", async () => {
        console.log(`❌ Client disconnected: ${socket.id}, emp_id: ${empId}`);

        if (empId && onlineUsers.has(empId)) {
            // ลบ socket ID ที่ disconnect ออกจาก Set ของ user
            onlineUsers.get(empId).delete(socket.id);

            // ตรวจสอบว่า user ยังมี socket อื่นเหลืออยู่ไหม
            // (กรณีเปิดหลาย tab → ปิดแค่ tab เดียวยังไม่ถือว่า offline)
            if (onlineUsers.get(empId).size === 0) {
                // ไม่มี socket เหลือแล้ว = user offline จริง
                onlineUsers.delete(empId);

                // อัปเดต Database: ตั้ง is_online = 0 และบันทึกเวลา last_seen
                // last_seen จะใช้แสดง "ออนไลน์ล่าสุดเมื่อ ..." ในอนาคตได้
                try {
                    await pool.query(
                        "UPDATE EMP SET is_online = 0, last_seen = NOW() WHERE emp_id = ?",
                        [empId]
                    );
                } catch (err) {
                    console.error("Error updating offline status:", err.message);
                }

                // Broadcast สถานะ "offline" ให้ทุก client อัปเดต UI
                io.emit("user-status-changed", { emp_id: empId, is_online: false });
            }
        }
    });
});

// ===== LINE Webhook (Custom Handling for Multi-Channel) =====
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const signature = req.headers["x-line-signature"];
    if (!signature) {
        console.warn("⚠️ [Webhook] Missing x-line-signature header");
        return res.status(401).send("No signature");
    }

    const rawBody = req.body.toString();
    let body;
    try {
        body = JSON.parse(rawBody);
    } catch (err) {
        return res.status(400).send("Invalid JSON body");
    }

    const { destination, events } = body;

    console.log(`\n--- 📩 Webhook Incoming [${new Date().toLocaleTimeString()}] ---`);
    console.log(`📍 Destination: ${destination}`);
    console.log(`🎯 Events: ${events?.length || 0}`);

    // 1. Handle LINE Verify (No events sent)
    if (!events || events.length === 0) {
        console.log(`✅ [Webhook] LINE Verify received for destination: ${destination}`);
        return res.status(200).send("OK");
    }

    // 2. Resolve Secret Dynamically (with caching in controller)
    const secret = await lineController.getChannelSecret(destination);
    if (!secret) {
        console.error(`❌ [Webhook] No active channel found for destination: ${destination}`);
        return res.status(401).send("Unknown destination");
    }

    // 3. Validate Signature using RAW body
    const isValid = line.validateSignature(rawBody, secret, signature);
    console.log(`🔐 Signature Secret used (prefix): ${secret.substring(0, 4)}...`);
    
    if (!isValid) {
        console.error(`❌ [Webhook] Invalid signature for destination: ${destination}`);
        return res.status(401).send("Invalid signature");
    }

    console.log(`✅ [Webhook] Signature Validated for: ${destination}`);

    // 4. Authorized -> Set parsed body and forward to controller
    req.body = body;
    return lineController.handleWebhook(req, res);
});


// ===== FACEBOOK Webhook =====
const fbController = require("./controllers/FbController.js");
app.get('/webhook/facebook', fbController.verifyWebhook);
app.post('/webhook/facebook', express.json(), fbController.handleWebhook);


// ===== Middleware =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
app.use("/api/channels", channelsRouter);
app.use("/api/teams", teamRouter);
app.use("/api/members", membersRouter);
app.use("/api/tags", tagsRouter);

// ===== Facebook API =====
const auth = require("./middleware/auth.js");
app.post("/api/facebook/sync-history", auth, fbController.syncConversationHistory);

// เปิดเซิร์ฟเวอร์ (ใช้ server.listen แทน app.listen เพื่อให้ Socket.IO ทำงาน)
// ดึง Port จาก Railway ถ้าไม่มีให้ใช้ 3000 (สำหรับรันในเครื่อง)
const PORT = process.env.PORT || 3000;

// เปิดเซิร์ฟเวอร์
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT} (with Socket.IO)`);
    
    // แสดง IP ของเครื่องเพื่อให้คนอื่นเชื่อมต่อได้ง่ายขึ้น
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    console.log('🔗 Local Network Access:');
    Object.keys(networkInterfaces).forEach((interfaceName) => {
        networkInterfaces[interfaceName].forEach((details) => {
            if (details.family === 'IPv4' && !details.internal) {
                console.log(`   - http://${details.address}:${PORT}`);
            }
        });
    });
});
