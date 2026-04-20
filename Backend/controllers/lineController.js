const line = require("@line/bot-sdk");
const fs = require("fs");
const path = require("path");
const db = require("../config/db.js");
const Log = require("../models/log.js");
const Notification = require("../models/notification.js");
const cloudinary = require("../config/cloudinary");

// Caching layers for performance
const credentialCache = new Map(); // destination_id -> { access_token, channel_secret }
const messagingClientCache = new Map(); // destination_id -> MessagingApiClient
const blobClientCache = new Map(); // destination_id -> MessagingApiBlobClient

/**
 * Helper: ดึง Access Token และ Secret จาก DB (มีระบบ Cache)
 */
async function getLineCredentials(destination) {
    if (!destination) return null;
    
    // 1. Check cache first
    if (credentialCache.has(destination)) {
        return credentialCache.get(destination);
    }

    // 2. Cache miss -> Query DB
    try {
        const [rows] = await db.query(
            "SELECT access_token, channel_secret FROM channels WHERE platform = 'line' AND destination_id = ? AND status = 'active' LIMIT 1",
            [destination]
        );
        if (rows.length > 0) {
            const creds = rows[0];
            credentialCache.set(destination, creds);
            return creds;
        }
    } catch (err) {
        console.error("[LINE Cache] DB Error:", err.message);
    }
    return null;
}

/**
 * Factory: สร้างหรือดึง Messaging Client จาก Cache
 */
async function getMessagingClient(destination) {
    // Check cache first
    if (messagingClientCache.has(destination)) {
        return messagingClientCache.get(destination);
    }
    
    // Cache miss -> Get credentials and create client
    const creds = await getLineCredentials(destination);
    if (!creds?.access_token) {
        console.error(`❌ [LINE Factory] Cannot create MessagingClient: No access token for ${destination}`);
        return null;
    }

    const client = new line.messagingApi.MessagingApiClient({ 
        channelAccessToken: creds.access_token 
    });
    messagingClientCache.set(destination, client);
    return client;
}

/**
 * Factory: สร้างหรือดึง Blob Client จาก Cache
 */
async function getBlobClient(destination) {
    if (blobClientCache.has(destination)) {
        return blobClientCache.get(destination);
    }
    const creds = await getLineCredentials(destination);
    if (!creds?.access_token) return null;

    const client = new line.messagingApi.MessagingApiBlobClient({ 
        channelAccessToken: creds.access_token 
    });
    blobClientCache.set(destination, client);
    return client;
}

/**
 * Helper: ล้าง Cache เมื่อมีการแก้ไขตั้งค่า Channel
 */
exports.clearCache = (destination) => {
    if (destination) {
        console.log(`🧹 [LINE Cache] Clearing cache for destination: ${destination}`);
        credentialCache.delete(destination);
        messagingClientCache.delete(destination);
        blobClientCache.delete(destination);
    } else {
        console.log("🧹 [LINE Cache] Clearing ALL caches");
        credentialCache.clear();
        messagingClientCache.clear();
        blobClientCache.clear();
    }
};

/**
 * Helper: สำหรับให้ server.js ดึง Secret มาใช้ Validate Signature
 */
exports.getChannelSecret = async (destination) => {
    const creds = await getLineCredentials(destination);
    return creds ? creds.channel_secret : null;
};

// Helper: สร้างวันที่เวลาแบบ MySQL format
const getLocalDatetime = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// รับข้อมูลจาก Route แล้วแยกกระจายงาน
exports.handleWebhook = async (req, res) => {
    const destination = req.body.destination;
    const events = req.body.events || [];
    
    console.log(`📩 [LINE Webhook] Received ${events.length} events for destination: ${destination}`);
    
    // LINE Verify Handling (Handled in server.js but safe here too)
    if (events.length === 0) {
        return res.status(200).send("OK");
    }

    const io = req.app.get("io");

    // Process events with dynamic clients
    Promise.all(events.map((event) => handleEvent(event, io, destination)))
        .then(() => res.status(200).send("OK"))
        .catch((err) => {
            console.error("[LINE Webhook Error]", err);
            res.status(500).end();
        });
};

async function handleEvent(event, io, destination) {
    if (!event.source || !event.source.userId) return null;

    const userId = event.source.userId;

    try {
        // 1. ระบุบอท (Channel ID) ที่ได้รับข้อความก่อน
        let channelId = null;
        let channelName = "LINE";
        if (destination) {
            const [matchedChannels] = await db.query(
                "SELECT id, channel_name FROM channels WHERE platform = 'line' AND status = 'active' AND destination_id = ? LIMIT 1",
                [destination]
            );
            if (matchedChannels.length > 0) {
                channelId = matchedChannels[0].id;
                channelName = matchedChannels[0].channel_name;
            } else {
                console.error(`❌ [LINE handleEvent] Critical: Destination ${destination} not found or inactive.`);
                return;
            }
        }

        if (!channelId) {
            console.error("❌ [LINE handleEvent] Could not resolve channelId. Event ignored.");
            return;
        }

        // 2. ตรวจสอบว่าลูกค้าคนนี้ "ในบอทตัวนี้" เคยมีอยู่แล้วหรือยัง
        const [existingRows] = await db.query(
            "SELECT cus_id, cus_name, displayname, cus_picture, updated_at FROM customers WHERE platform = 'line' AND platform_id = ? AND channel_id = ?",
            [userId, channelId],
        );
        const isNewCustomer = existingRows.length === 0;

        let displayName, pictureUrl, customerId;

        if (isNewCustomer) {
            // ลูกค้าใหม่ (สำหรับบอทนี้) → เรียก LINE API ดึงโปรไฟล์
            const client = await getMessagingClient(destination);
            if (!client) throw new Error(`[LINE] No client found for destination ${destination}`);

            const profile = await client.getProfile(userId);
            displayName = profile.displayName;
            pictureUrl = profile.pictureUrl || "";

            await db.query(
                `INSERT INTO customers (platform, platform_id, cus_name, cus_picture, channel_id) VALUES ('line', ?, ?, ?, ?)`,
                [userId, displayName, pictureUrl, channelId],
            );
            const [rows] = await db.query(
                "SELECT cus_id FROM customers WHERE platform = 'line' AND platform_id = ? AND channel_id = ?",
                [userId, channelId],
            );
            customerId = rows[0].cus_id;

            console.log(`[LINE] New Customer Created per Bot: ${displayName} (UID: ${userId}) on Channel: ${channelName} (ID: ${channelId})`);

            if (io) {
                io.emit("new-customer", {
                    cus_id: customerId,
                    cus_name: displayName,
                    cus_picture: pictureUrl,
                    platform: "line",
                    platform_id: userId,
                    channel_id: channelId,
                    channel_name: channelName,
                    first_message:
                        event.type === "message" && event.message.type === "text"
                            ? event.message.text
                            : "",
                });
            }
        } else {
            // ลูกค้าเก่า (ในบอทนี้) → ใช้ข้อมูลจาก DB
            customerId = existingRows[0].cus_id;
            displayName = existingRows[0].displayname || existingRows[0].cus_name;
            pictureUrl = existingRows[0].cus_picture || "";

            console.log(`✅ [LINE] Found Existing Customer: ${displayName} on Channel: ${channelName}`);

            // อัพเดทโปรไฟล์ทุก 24 ชม. (fire-and-forget)
            const lastUpdate = new Date(existingRows[0].updated_at);
            const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceUpdate >= 24) {
                refreshCustomerProfile(customerId, userId, destination)
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
                const blobClient = await getBlobClient(destination);
                if (!blobClient) throw new Error(`[LINE] No blobClient for ${destination}`);

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
async function refreshCustomerProfile(customerId, lineUserId, destination) {
    const client = await getMessagingClient(destination);
    if (!client) return { name: "", pic: "" };

    const profile = await client.getProfile(lineUserId);
    const name = profile.displayName;
    const pic = profile.pictureUrl || "";
    await db.query(
        "UPDATE customers SET cus_name = ?, cus_picture = ?, updated_at = NOW() WHERE cus_id = ?",
        [name, pic, customerId],
    );
    console.log(`[LINE] Profile refreshed: ${name} (UID: ${lineUserId})`);
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

/** 
 * Export client getter สำหรับ module อื่น (เช่น messagesRouter) 
 * เพื่อใช้ส่งข้อความกลับไปยัง LINE ตามแต่ละลูกค้า
 */
exports.getLineClientByCustomerId = async (customerId) => {
    try {
        const [rows] = await db.query(
            "SELECT ch.destination_id FROM customers c JOIN channels ch ON c.channel_id = ch.id WHERE c.cus_id = ?",
            [customerId]
        );
        if (rows.length > 0 && rows[0].destination_id) {
            return await getMessagingClient(rows[0].destination_id);
        }
    } catch (err) {
        console.error("[LINE Client Factory] Error fetching client:", err.message);
    }
    return null;
};
