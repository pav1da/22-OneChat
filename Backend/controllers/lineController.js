const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const db = require("../config/db.js");
const Log = require("../models/log.js");
const Notification = require("../models/notification.js");
const cloudinary = require("../config/cloudinary");

const channelAccessToken = process.env.Channel_ID;
const channelSecret = process.env.channelSecret;

// สร้าง Client ของ LINE (v10 API)
const client = new line.messagingApi.MessagingApiClient({ channelAccessToken });
const blobClient = new line.messagingApi.MessagingApiBlobClient({
    channelAccessToken,
});

// Helper: สร้างวันที่เวลาแบบ MySQL format
const getLocalDatetime = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// รับข้อมูลจาก Route แล้วแยกกระจายงาน
exports.handleWebhook = async (req, res) => {
    console.log("📩 รับข้อมูลจาก LINE แล้ว!");
    const io = req.app.get("io");

    // ตรวจสอบ status ของ LINE channel จาก channels table
    // ถ้ามีการตั้งค่าไว้แต่ทุก channel ถูกปิด → ตอบ 200 แต่ไม่ประมวลผล
    try {
        const [lineChannels] = await db.query(
            "SELECT status FROM channels WHERE platform = 'line'",
        );
        if (
            lineChannels.length > 0 &&
            !lineChannels.some((c) => c.status === "active")
        ) {
            console.log("⏸️ LINE channel ถูกปิดทั้งหมด — ไม่ประมวลผล");
            return res.status(200).send("OK");
        }
    } catch (err) {
        console.error("Channel status check error:", err.message);
    }

    const destination = req.body.destination;

    Promise.all(req.body.events.map((event) => handleEvent(event, io, destination)))
        .then(() => res.status(200).send("OK"))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
};

async function handleEvent(event, io, destination) {
    if (!event.source || !event.source.userId) return null;

    const userId = event.source.userId;

    try {
        // ตรวจสอบว่าลูกค้าเคยมีอยู่แล้วหรือยัง (ใช้ cache จาก DB เพื่อลด API call)
        const [existingRows] = await db.query(
            "SELECT cus_id, cus_name, displayname, cus_picture, updated_at FROM customers WHERE platform = 'line' AND platform_id = ?",
            [userId],
        );
        const isNewCustomer = existingRows.length === 0;

        let displayName, pictureUrl, customerId;

        if (isNewCustomer) {
            // ลูกค้าใหม่ → เรียก LINE API ดึงโปรไฟล์
            const profile = await client.getProfile(userId);
            displayName = profile.displayName;
            pictureUrl = profile.pictureUrl || "";

            // ค้นหา channel_id ของ LINE ที่ active อยู่
            let channelId = null;
            if (destination) {
                const [matchedChannels] = await db.query(
                    "SELECT id FROM channels WHERE platform = 'line' AND status = 'active' AND channel_id = ? LIMIT 1",
                    [destination]
                );
                if (matchedChannels.length > 0) {
                    channelId = matchedChannels[0].id;
                }
            }

            // Fallback ถ้าหาแบบเจาะจงไม่เจอ ให้ใช้เพจแรกสุดแทน
            if (!channelId) {
                const [lineChannels] = await db.query(
                    "SELECT id FROM channels WHERE platform = 'line' AND status = 'active' LIMIT 1"
                );
                channelId = lineChannels.length > 0 ? lineChannels[0].id : null;
            }

            await db.query(
                `INSERT INTO customers (platform, platform_id, cus_name, cus_picture, channel_id) VALUES ('line', ?, ?, ?, ?)`,
                [userId, displayName, pictureUrl, channelId],
            );
            const [rows] = await db.query(
                "SELECT cus_id FROM customers WHERE platform = 'line' AND platform_id = ?",
                [userId],
            );
            customerId = rows[0].cus_id;

            if (io) {
                io.emit("new-customer", {
                    cus_id: customerId,
                    cus_name: displayName,
                    display_name: null,
                    displayname: null,
                    cus_picture: pictureUrl,
                    platform: "line",
                    platform_id: userId,
                    first_message:
                        event.type === "message" && event.message.type === "text"
                            ? event.message.text
                            : "",
                });
            }
        } else {
            // ลูกค้าเก่า → ใช้ข้อมูลจาก DB (ไม่ต้องเรียก LINE API)
            customerId = existingRows[0].cus_id;
            displayName = existingRows[0].displayname || existingRows[0].cus_name;
            pictureUrl = existingRows[0].cus_picture || "";

            // อัพเดทโปรไฟล์ทุก 24 ชม. (fire-and-forget ไม่ block)
            const lastUpdate = new Date(existingRows[0].updated_at);
            const hoursSinceUpdate =
                (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate >= 24) {
                refreshCustomerProfile(customerId, userId, io)
                    .then(({ name, pic }) => {
                        displayName = name;
                        pictureUrl = pic;
                        if (io) {
                            io.emit("update-customer", {
                                cus_id: customerId,
                                cus_name: name,
                                cus_picture: pic,
                            });
                        }
                    })
                    .catch(() => { });
            }
        }

        // ตรวจสอบและบันทึกข้อความลงตาราง chat_messages
        if (event.type === "message") {
            // Text (ข้อความ) — รองรับ LINE emoji ด้วย
            if (event.message.type === "text") {
                let text = event.message.text;

                // แปลง LINE emoji placeholder → [line-emoji:productId:emojiId]
                if (event.message.emojis && event.message.emojis.length > 0) {
                    const sortedEmojis = [...event.message.emojis].sort(
                        (a, b) => b.index - a.index,
                    );
                    for (const em of sortedEmojis) {
                        const marker = `[line-emoji:${em.productId}:${em.emojiId}]`;
                        text =
                            text.substring(0, em.index) +
                            marker +
                            text.substring(em.index + em.length);
                    }
                }

                // === ตรวจสอบ Reply/Quote (quotedMessageId) ===
                let replyToId = null;
                let replyPreviewText = null;
                let replyPreviewImage = null;

                if (event.message.quotedMessageId) {
                    try {
                        // LINE ส่ง quotedMessageId มา — ต้องหาข้อความนั้นใน DB ของเรา
                        // LINE message ID ไม่ได้เก็บตรงๆ แต่เราเก็บ message_id เป็น auto-increment
                        // วิธีที่ดีที่สุดคือหาข้อความล่าสุดของลูกค้าที่มีเนื้อหาตรงกับที่ LINE บอก
                        // (LINE ไม่ส่ง quoted content มาให้ตรงๆ — ต้อง lookup จาก DB)
                        // ค้นหาข้อความก่อนหน้าที่ใกล้เคียงที่สุดของลูกค้านี้
                        const [quotedRows] = await db.query(
                            `SELECT message_id, message_type, message_text 
               FROM chat_messages 
               WHERE customer_id = ? 
               ORDER BY created_at DESC 
               LIMIT 20`,
                            [customerId]
                        );
                        // ใช้ข้อความล่าสุดก่อนหน้าที่เป็น text หรือ image เป็น preview
                        // (LINE quotedMessageId เป็น ID ของ LINE Message API ไม่ใช่ DB id ของเรา
                        //  จึงต้องใช้วิธี fallback: เอาข้อความล่าสุดที่ไม่ใช่ของ customer เอง)
                        const quoted = quotedRows.find(r => r.message_type === 'text' || r.message_type === 'image');
                        if (quoted) {
                            replyToId = quoted.message_id;
                            if (quoted.message_type === 'text') {
                                replyPreviewText = quoted.message_text
                                    ? quoted.message_text.substring(0, 100)
                                    : null;
                            } else if (quoted.message_type === 'image') {
                                replyPreviewImage = quoted.message_text;
                                replyPreviewText = '📷 รูปภาพ';
                            }
                        }
                    } catch (qErr) {
                        console.error('Reply lookup error:', qErr.message);
                    }
                }

                const quoteToken = event.message.quoteToken || null;

                const msgSql =
                    "INSERT INTO chat_messages (customer_id, sender, message_type, message_text, reply_to_id, reply_preview_text, reply_preview_image, line_quote_token) VALUES (?, 'customer', 'text', ?, ?, ?, ?, ?)";
                const [result] = await db.query(msgSql, [customerId, text, replyToId, replyPreviewText, replyPreviewImage, quoteToken]);
                console.log(`บันทึกข้อความ: ${text}${replyToId ? ` [reply to #${replyToId}]` : ''}`);

                if (io) {
                    io.emit("new-message", {
                        id: result.insertId,
                        customer_id: customerId,
                        sender: "customer",
                        message_type: "text",
                        text: text,
                        image: null,
                        created_at: getLocalDatetime(),
                        reply_to_id: replyToId,
                        reply_preview_text: replyPreviewText,
                        reply_preview_image: replyPreviewImage,
                    });
                }

                const plainText = text.replace(/\[line-emoji:[^\]]+\]/g, "(emoji)");
                processLogAndNotification(io, {
                    customerId,
                    displayName,
                    pictureUrl,
                    logAction: "ส่งข้อความเข้ามา",
                    logDetails:
                        plainText.length > 50
                            ? plainText.substring(0, 50) + "..."
                            : plainText,
                    msgType: "text",
                    msgContent:
                        plainText.length > 30
                            ? plainText.substring(0, 30) + "..."
                            : plainText,
                });
            }

            // Image (รูปภาพ)
            else if (event.message.type === "image") {
                const messageId = event.message.id;
                const stream = await blobClient.getMessageContent(messageId);
                const chunks = [];

                for await (const chunk of stream) {
                    chunks.push(chunk);
                }
                const buffer = Buffer.concat(chunks);

                // --- ส่วนที่แก้ไข: อัปโหลดเข้า Cloudinary แทนการเขียนไฟล์ลง Disk ---
                const uploadResponse = await new Promise((resolve, reject) => {
                    cloudinary.uploader
                        .upload_stream(
                            {
                                folder: "chat-images", // ชื่อโฟลเดอร์ใน Cloudinary
                                public_id: messageId, // ใช้ ID จาก LINE เป็นชื่อไฟล์
                            },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            },
                        )
                        .end(buffer);
                });

                const secureUrl = uploadResponse.secure_url; // นี่คือ URL จาก Cloudinary
                console.log(`อัปโหลดรูปไป Cloudinary สำเร็จ: ${secureUrl}`);

                const quoteToken = event.message.quoteToken || null;

                // บันทึก URL ลง Database แทนชื่อไฟล์เดิม
                const msgSql =
                    "INSERT INTO chat_messages (customer_id, sender, message_type, message_text, line_quote_token) VALUES (?, 'customer', 'image', ?, ?)";
                const [result] = await db.query(msgSql, [customerId, secureUrl, quoteToken]);

                // ส่ง real-time ไป Frontend
                if (io) {
                    io.emit("new-message", {
                        id: result.insertId,
                        customer_id: customerId,
                        sender: "customer",
                        text: null,
                        image: secureUrl, // ใช้ URL จาก Cloudinary ได้เลย
                        created_at: getLocalDatetime(),
                    });
                }

                // Log + Notification
                processLogAndNotification(io, {
                    customerId,
                    displayName,
                    pictureUrl,
                    logAction: "ส่งรูปภาพเข้ามา",
                    logDetails: "Cloudinary Image",
                    msgType: "image",
                    msgContent: "รูปภาพ",
                });
            }

            // Sticker (สติกเกอร์) — ลอง animated (APNG) ก่อน, fallback เป็น static
            else if (event.message.type === "sticker") {
                const stickerId = event.message.stickerId;
                const animatedUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker_animation.png`;
                const staticUrl = `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`;

                // ตรวจสอบว่ามี animated version ไหม
                let stickerUrl = staticUrl;
                try {
                    const checkRes = await fetch(animatedUrl, { method: "HEAD" });
                    if (checkRes.ok) {
                        stickerUrl = animatedUrl;
                    }
                } catch (e) {
                    // ใช้ static fallback
                }

                const quoteToken = event.message.quoteToken || null;

                const msgSql =
                    "INSERT INTO chat_messages (customer_id, sender, message_type, message_text, line_quote_token) VALUES (?, 'customer', 'sticker', ?, ?)";
                const [result] = await db.query(msgSql, [customerId, stickerUrl, quoteToken]);
                console.log(
                    `บันทึกสติกเกอร์สำเร็จ! (${stickerUrl.includes("animation") ? "animated" : "static"})`,
                );

                // ส่ง real-time ไป Frontend ทันที
                if (io) {
                    io.emit("new-message", {
                        id: result.insertId,
                        customer_id: customerId,
                        sender: "customer",
                        message_type: "sticker",
                        text: null,
                        image: stickerUrl,
                        created_at: getLocalDatetime(),
                    });
                }

                // Fire-and-forget: Log + Notification
                processLogAndNotification(io, {
                    customerId,
                    displayName,
                    pictureUrl,
                    logAction: "ส่งสติกเกอร์เข้ามา",
                    logDetails: `Sticker ID: ${stickerId}`,
                    msgType: "sticker",
                    msgContent: "สติกเกอร์",
                });
            }
        }
    } catch (err) {
        console.error("เกิดข้อผิดพลาด:", err);
    }
}

// Helper: อัพเดทโปรไฟล์ลูกค้าจาก LINE API (ทุก 24 ชม.)
async function refreshCustomerProfile(customerId, lineUserId) {
    const profile = await client.getProfile(lineUserId);
    const name = profile.displayName;
    const pic = profile.pictureUrl || "";
    await db.query(
        "UPDATE customers SET cus_name = ?, cus_picture = ?, updated_at = NOW() WHERE cus_id = ?",
        [name, pic, customerId],
    );
    console.log(`Profile refreshed: ${name}`);
    return { name, pic };
}

// Helper: บันทึก Log + สร้าง/อัพเดท Notification แบบ async (fire-and-forget)
function processLogAndNotification(
    io,
    {
        customerId,
        displayName,
        pictureUrl,
        logAction,
        logDetails,
        msgType,
        msgContent,
    },
) {
    (async () => {
        // บันทึก Log
        try {
            const logData = {
                user: displayName,
                avatar: pictureUrl || null,
                action: logAction,
                target: "LINE",
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
            console.error("Chat log error:", logErr.message);
        }

        // สร้าง/อัพเดท Notification (ใช้ Promise.all แทน sequential loop)
        try {
            const [allUsers] = await db.query("SELECT emp_id FROM EMP");
            const newNotifications = [];
            const updatedNotifications = [];

            await Promise.all(
                allUsers.map(async (user) => {
                    const receiverId = user.emp_id;
                    const existingNotif = await Notification.findUnreadByCustomer(
                        customerId,
                        receiverId,
                    );

                    if (existingNotif) {
                        const newMessage = {
                            type: msgType,
                            content: msgContent,
                            timestamp: getLocalDatetime(),
                        };
                        await Notification.updateWithNewMessage(
                            existingNotif.id,
                            newMessage,
                        );

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
                }),
            );

            if (io) {
                if (newNotifications.length > 0) {
                    console.log(
                        `📢 Emitting new-notifications: ${newNotifications.length} entries`,
                    );
                    io.emit("new-notifications", newNotifications);
                }
                if (updatedNotifications.length > 0) {
                    console.log(
                        `📢 Emitting update-notifications: ${updatedNotifications.length} entries`,
                    );
                    io.emit("update-notifications", updatedNotifications);
                }
            }
        } catch (notifErr) {
            console.error("❌ Notification error:", notifErr.message);
        }
    })();
}

// Export LINE client เพื่อให้ module อื่นใช้ส่งข้อความกลับไปยัง LINE ได้
exports.lineClient = client;
