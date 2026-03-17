const line = require("@line/bot-sdk");
const express = require("express");
const db = require("./config/db.js");
const dotenv = require("dotenv");
dotenv.config();

const config = {
  channelAccessToken: process.env.Channel_ID,
  channelSecret: process.env.channelSecret,
};

const app = express();

// Route สำหรับรับ Webhook
app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.status(200).send("OK"))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  // รับเฉพาะข้อความที่เป็น Text
  if (event.type === "message" && event.message.type === "text") {
    const lineId = event.source.userId;
    const text = event.message.text;

    // บันทึกลง MySQL ที่รันใน Docker
    const sql =
      "INSERT INTO line_messages (user_id, message_text, created_at) VALUES (?, ?, NOW())";
    await db.query(sql, [lineId, text]);

    console.log(`Saved: ${text} from ${lineId}`);
  }
}

app.listen(3000, () => console.log("Server is running on port 3000"));
