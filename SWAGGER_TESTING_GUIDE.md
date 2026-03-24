# 📘 คู่มือทดสอบ Swagger & เตรียมสอบ Progress

---

## ส่วนที่ 1: วิธีทดสอบ Swagger

### 1.1 เปิด Swagger UI
```
1. Start backend:  cd Backend → npm start
2. เปิดเบราว์เซอร์:  http://localhost:3000/api-docs
```

### 1.2 วิธีใช้ Swagger UI ทดสอบ API

#### ขั้นตอนที่ 1: Login เอา Token ก่อน
1. เลื่อนไปหา **Users** → `POST /api/users/login`
2. กด **Try it out**
3. ใส่ body:
```json
{
  "username": "admin1",
  "password": "1234"
}
```
4. กด **Execute**
5. ดู Response → **คัดลอก token** ที่ได้ (เช่น `eyJhbGciOi...`)

#### ขั้นตอนที่ 2: ใส่ Token เพื่อเข้าถึง API อื่น
1. กดปุ่ม **🔒 Authorize** (ด้านบนขวาของหน้า Swagger)
2. ใส่ token ที่ copy มา (ไม่ต้องใส่ "Bearer " นำหน้า)
3. กด **Authorize** → กด **Close**
4. ตอนนี้ทุก API ที่มี 🔒 จะใช้ token นี้โดยอัตโนมัติ

#### ขั้นตอนที่ 3: ทดสอบแต่ละ API
1. เลือก endpoint ที่ต้องการ เช่น `GET /api/customers`
2. กด **Try it out**
3. กรอก parameter (ถ้ามี)
4. กด **Execute**
5. ดูผลลัพธ์:
   - **Response code** (200, 201, 400, 401, 404, 500)
   - **Response body** (ข้อมูลที่ API ส่งกลับมา)

---

### 1.3 ทดสอบทุก Endpoint — Checklist

#### 🟢 API Keys
| Method | Endpoint | ทดสอบอะไร |
|--------|----------|-----------|
| GET | `/api/api-keys` | ดึง API keys ทั้งหมด → ต้องได้ 200 |
| POST | `/api/api-keys` | สร้าง key ใหม่ → ต้องได้ 201 |
| PUT | `/api/api-keys/{id}/toggle` | เปิด/ปิด key → ต้องได้ 200 |
| POST | `/api/api-keys/reset-personal` | รีเซ็ต personal key → ต้องได้ 200 |

#### 🟢 Customers
| Method | Endpoint | ทดสอบอะไร |
|--------|----------|-----------|
| GET | `/api/customers` | ดึงลูกค้าทั้งหมด → ต้องได้ array |
| GET | `/api/customers/{id}` | ดึงลูกค้า ID 1 → ต้องได้ object |
| GET | `/api/customers/999` | ID ไม่มี → ต้องได้ 404 |
| PUT | `/api/customers/{id}/name` | เปลี่ยนชื่อ → ต้องได้ 200 |

#### 🟢 Messages
| Method | Endpoint | ทดสอบอะไร |
|--------|----------|-----------|
| GET | `/api/messages` | ดึงข้อความทั้งหมด (grouped) → ต้องได้ object |
| GET | `/api/messages/{customerId}` | ดึงข้อความของลูกค้า 1 คน |
| POST | `/api/messages` | ส่งข้อความใหม่ → ต้องได้ 201 + ส่งไป LINE |

#### 🟢 Notes
| Method | Endpoint | ทดสอบอะไร |
|--------|----------|-----------|
| GET | `/api/notes/{customerId}` | ดึงโน้ตของลูกค้า |
| POST | `/api/notes` | สร้างโน้ตใหม่ → ต้องได้ 201 |
| PUT | `/api/notes/{id}` | แก้ไขโน้ต → ต้องได้ 200 |
| DELETE | `/api/notes/{id}` | ลบโน้ต → ต้องได้ 200 |

#### 🟢 Templates
| Method | Endpoint | ทดสอบอะไร |
|--------|----------|-----------|
| GET | `/api/templates` | ดึง template ทั้งหมด |
| GET | `/api/templates/{id}` | ดึง template ตาม ID |
| GET | `/api/templates/type/{type}` | ดึงตามประเภท (buttons/confirm/carousel) |
| POST | `/api/templates` | สร้าง template ใหม่ |
| PUT | `/api/templates/{id}` | อัพเดท template |
| DELETE | `/api/templates/{id}` | ลบ template |

#### 🟢 Logs
| Method | Endpoint | ทดสอบอะไร |
|--------|----------|-----------|
| GET | `/api/logs` | ดึง log ทั้งหมด |
| GET | `/api/logs?user=admin1` | กรองตาม user |
| POST | `/api/logs` | สร้าง log ใหม่ |

#### 🟢 Notifications
| Method | Endpoint | ทดสอบอะไร |
|--------|----------|-----------|
| POST | `/api/notifications` | สร้าง notification |
| GET | `/api/notifications` | ดึง notification ของ user |
| GET | `/api/notifications/unread-count` | นับจำนวนยังไม่อ่าน |
| PUT | `/api/notifications/{id}/read` | mark as read |

#### 🟢 Users
| Method | Endpoint | ทดสอบอะไร |
|--------|----------|-----------|
| POST | `/api/users/register` | สมัครสมาชิก |
| POST | `/api/users/login` | เข้าสู่ระบบ → ได้ token |

---

### 1.4 สิ่งที่ต้องดูใน Response

1. **Response Code** — ตรงตามที่ Swagger ระบุไหม?
   - `200` = สำเร็จ (GET/PUT/DELETE)
   - `201` = สร้างสำเร็จ (POST)
   - `400` = ข้อมูลไม่ครบ
   - `401` = ไม่มี token / token หมดอายุ
   - `404` = ไม่พบข้อมูล
   - `500` = server error

2. **Response Body** — โครงสร้างตรงตาม Schema ไหม?

3. **Error Cases** — ลองส่งข้อมูลผิดๆ ดูว่า API จัดการ error ถูกต้องไหม

---

## ส่วนที่ 2: เตรียมสอบ Progress

### 2.1 สิ่งที่ต้องเตรียม (ตามโจทย์)

#### ✅ 1. ชุดคำสั่ง Swagger
- เปิด Swagger UI ได้: `http://localhost:3000/api-docs`
- รู้วิธี Authorize ด้วย JWT token
- ทดสอบ API ผ่าน Swagger ได้ทุก endpoint
- อธิบาย request/response ของแต่ละ endpoint ได้

#### ✅ 2. ชุดคำสั่ง Backend
- **Routes ทั้งหมด** — รู้ว่ามีกี่ route, แต่ละ route ทำอะไร
- **Models** — Customer, Message, Note, Template, Log, User
- **Controllers** — lineController (webhook), usersController (auth), templateController
- **Middleware** — auth.js (JWT verify), authorize.js (role check)

#### ✅ 3. Return Code
ต้องตอบได้ว่า:
| Code | ความหมาย | ใช้ตอนไหน |
|------|----------|-----------|
| 200 | OK | GET สำเร็จ, PUT/DELETE สำเร็จ |
| 201 | Created | POST สร้างข้อมูลใหม่สำเร็จ |
| 400 | Bad Request | ข้อมูลไม่ครบ / format ผิด |
| 401 | Unauthorized | ไม่มี token / token ผิด |
| 403 | Forbidden | มี token แต่ไม่มีสิทธิ์ |
| 404 | Not Found | หาข้อมูลไม่เจอ |
| 500 | Internal Server Error | server เกิดข้อผิดพลาด |

#### ✅ 4. เรียก API ด้วย Postman (ถ้าจำเป็น)
```
- URL: http://localhost:3000/api/customers
- Method: GET
- Headers:
    Authorization: Bearer <token>
    Content-Type: application/json
```

#### ✅ 5. Frontend ที่เรียกใช้ API
ต้องชี้ได้ว่า frontend เรียก API จากไฟล์ไหน:

| ไฟล์ Frontend | เรียก API อะไร |
|--------------|----------------|
| `ChatContext.jsx` | `GET /api/customers`, `GET /api/messages`, `POST /api/messages` |
| `Inbox.jsx` | `POST /api/messages` (ส่งข้อความ/รูป), `GET/POST /api/notes` |
| `Allchat.jsx` | ใช้ข้อมูลจาก ChatContext |
| `Log.jsx` | `GET /api/logs` |
| `App.jsx` / Login | `POST /api/users/login`, `POST /api/users/register` |

---

### 2.2 คำถามที่อาจโดนถาม + คำตอบ

**Q: API นี้ทำอะไร?**
> A: อธิบายจาก Swagger → summary, request body, response

**Q: ถ้าส่ง request แบบนี้จะได้ response อะไร?**
> A: ดูจาก Swagger response schema + ลอง Execute ให้ดู

**Q: Frontend เรียก API ตรงไหน?**
> A: ชี้ไปที่ไฟล์ เช่น ChatContext.jsx line XX ใช้ fetch("/api/messages")

**Q: ถ้าไม่ส่ง token จะเกิดอะไร?**
> A: ได้ 401 Unauthorized เพราะ auth middleware จะ reject

**Q: Return code 201 vs 200 ต่างกันยังไง?**
> A: 201 = สร้างข้อมูลใหม่สำเร็จ (POST), 200 = ดำเนินการสำเร็จทั่วไป

**Q: WebSocket ใช้ทำอะไร?**
> A: ส่ง real-time events — new-message, new-customer, new-log, user-status-changed

---

### 2.3 สรุป Architecture ของระบบ

```
LINE User  ──webhook──▶  Backend (Express + Socket.IO)  ◀──API──  Frontend (React)
                              │
                         MySQL (Railway)
                              │
                    Tables: EMP, customers, chat_messages, notes, templates, LOGS
```

- **LINE → Backend**: ผ่าน webhook `/webhook` → `lineController.js`
- **Backend → LINE**: ผ่าน `lineClient.pushMessage()` ใน `messagesRouter.js`
- **Frontend ↔ Backend**: REST API (`/api/*`) + WebSocket (Socket.IO)
- **Real-time**: Socket.IO events ทำให้ไม่ต้อง refresh หน้า

---

## ส่วนที่ 3: ทดสอบ Backend Return Code (สำคัญมาก!)

### 3.1 Return Code คืออะไร?

Return Code (HTTP Status Code) คือตัวเลขที่ backend ส่งกลับมาบอก frontend ว่า request สำเร็จหรือไม่

### 3.2 วิธีดู Return Code

#### วิธีที่ 1: ดูใน Swagger UI
- กด Execute → ดูตรง **Server response → Code** (เช่น 200, 401)

#### วิธีที่ 2: ดูใน Postman
- กด Send → ดูตรงมุมขวาบน **Status: 200 OK**

#### วิธีที่ 3: ดูใน Browser DevTools
- กด F12 → แท็บ Network → คลิก request → ดู Status

### 3.3 Return Code ของแต่ละ Route (ต้องท่องได้!)

#### Users
| Route | สำเร็จ | ข้อมูลไม่ครบ | รหัสผิด | ไม่มี token |
|-------|--------|-------------|---------|------------|
| `POST /api/users/register` | **201** | 400 | - | - |
| `POST /api/users/login` | **200** | 400 | **401** | - |
| `GET /api/users/me` | **200** | - | - | **401** |
| `PUT /api/users/me/username` | **200** | 400 | 401 | 401 |
| `PUT /api/users/me/email` | **200** | 400 | 401 | 401 |
| `PUT /api/users/me/phone` | **200** | 400 | - | 401 |
| `PUT /api/users/me/password` | **200** | 400 | 401 | 401 |
| `PUT /api/users/me/avatar` | **200** | 400 | - | 401 |
| `DELETE /api/users/:id` | **200** | - | - | 401 |

#### Customers
| Route | สำเร็จ | ไม่พบ | ข้อมูลไม่ครบ | ไม่มี token |
|-------|--------|------|-------------|------------|
| `GET /api/customers` | **200** | - | - | 401 |
| `GET /api/customers/:id` | **200** | **404** | - | 401 |
| `PUT /api/customers/:id/name` | **200** | 404 | **400** | 401 |

#### Messages
| Route | สำเร็จ | ข้อมูลไม่ครบ | ไม่มี token |
|-------|--------|-------------|------------|
| `GET /api/messages` | **200** | - | 401 |
| `GET /api/messages/:customerId` | **200** | - | 401 |
| `POST /api/messages` | **201** | **400** | 401 |

#### Notes
| Route | สำเร็จ | ไม่พบ | ข้อมูลไม่ครบ | ไม่มี token |
|-------|--------|------|-------------|------------|
| `GET /api/notes/:customerId` | **200** | - | - | 401 |
| `POST /api/notes` | **201** | - | **400** | 401 |
| `PUT /api/notes/:id` | **200** | **404** | 400 | 401 |
| `DELETE /api/notes/:id` | **200** | **404** | - | 401 |

#### Templates (ไม่ต้อง auth)
| Route | สำเร็จ | ไม่พบ | ข้อมูลไม่ครบ |
|-------|--------|------|-------------|
| `GET /api/templates` | **200** | - | - |
| `GET /api/templates/:id` | **200** | **404** | - |
| `GET /api/templates/type/:type` | **200** | - | - |
| `POST /api/templates` | **201** | - | **400** |
| `PUT /api/templates/:id` | **200** | **404** | 400 |
| `DELETE /api/templates/:id` | **200** | **404** | - |

#### Logs (ไม่ต้อง auth)
| Route | สำเร็จ |
|-------|--------|
| `GET /api/logs` | **200** |
| `POST /api/logs` | **201** |

#### API Keys
| Route | สำเร็จ | ไม่มี token |
|-------|--------|------------|
| `GET /api/api-keys` | **200** | 401 |
| `POST /api/api-keys` | **201** | 401 |
| `PUT /api/api-keys/:id/toggle` | **200** | 401 |
| `POST /api/api-keys/reset-personal` | **200** | 401 |

#### Notifications
| Route | สำเร็จ | ไม่มี token |
|-------|--------|------------|
| `POST /api/notifications` | **201** | 401 |
| `GET /api/notifications` | **200** | 401 |
| `GET /api/notifications/unread-count` | **200** | 401 |
| `PUT /api/notifications/:id/read` | **200** | 401 |

### 3.4 วิธีทดสอบ Return Code ให้ครบ

ทุก endpoint ควรทดสอบ **อย่างน้อย 2 กรณี**:

```
กรณีที่ 1: Happy Path (สำเร็จ)
  → ส่งข้อมูลถูกต้อง ครบทุก field
  → ต้องได้ 200 หรือ 201

กรณีที่ 2: Error Case
  → ส่งข้อมูลไม่ครบ → ต้องได้ 400
  → ไม่ส่ง token → ต้องได้ 401
  → ส่ง ID ที่ไม่มี → ต้องได้ 404
```

---

## ส่วนที่ 4: Postman — ต้องเตรียมไหม?

### คำตอบ: เตรียมไว้ดีกว่า เผื่อถูกถาม

### 4.1 ตั้งค่า Postman

```
1. เปิด Postman → New Collection → ตั้งชื่อ "OneChat API"
2. ตั้ง Variable:
   - base_url = http://localhost:3000
   - token = (เว้นไว้ก่อน ได้จาก login)
```

### 4.2 ทดสอบ Login

```
Method: POST
URL: {{base_url}}/api/users/login
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "identifier": "admin1",
  "password": "1234"
}

→ ได้ 200 + token กลับมา → คัดลอก token ไปใส่ Variable
```

### 4.3 ทดสอบ API ที่ต้อง Auth

```
Method: GET
URL: {{base_url}}/api/customers
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json

→ ได้ 200 + array ของลูกค้า
```

### 4.4 ทดสอบ POST (สร้างข้อมูลใหม่)

```
Method: POST
URL: {{base_url}}/api/messages
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body (raw JSON):
{
  "customer_id": 1,
  "sender": "own",
  "message_type": "text",
  "message_text": "ทดสอบจาก Postman"
}

→ ได้ 201 + { message: "ส่งข้อความสำเร็จ", id: ... }
```

### 4.5 ทดสอบ Error Case

```
# ไม่ส่ง token
Method: GET
URL: {{base_url}}/api/customers
(ไม่ใส่ Authorization header)
→ ได้ 401

# ส่ง ID ที่ไม่มี
Method: GET  
URL: {{base_url}}/api/customers/99999
Headers: Authorization: Bearer {{token}}
→ ได้ 404

# ส่งข้อมูลไม่ครบ
Method: POST
URL: {{base_url}}/api/messages
Headers: Authorization: Bearer {{token}}
Body: {}
→ ได้ 400
```

---

## ส่วนที่ 5: Frontend ที่เรียกใช้ API (ต้องชี้ได้!)

### 5.1 แผนผังไฟล์ → API

| ไฟล์ Frontend | API ที่เรียก | ทำอะไร |
|--------------|-------------|--------|
| **SignUpPage.jsx** | `POST /api/users/register` | สมัครสมาชิก |
| **SignInPage.jsx** | `POST /api/users/login` | เข้าสู่ระบบ → ได้ token เก็บใน sessionStorage |
| **ChatContext.jsx** | `GET /api/customers` | ดึงรายชื่อลูกค้าตอนเปิดหน้า |
| **ChatContext.jsx** | `GET /api/messages` | ดึงข้อความทั้งหมดตอนเปิดหน้า |
| **ChatContext.jsx** | `POST /api/messages` | ส่งข้อความ/รูปภาพไปหาลูกค้า |
| **ChatContext.jsx** | `PUT /api/customers/:id/name` | เปลี่ยนชื่อลูกค้า |
| **Inbox.jsx** | `GET /api/notes/:customerId` | ดึงโน้ตของลูกค้า |
| **Inbox.jsx** | `POST /api/notes` | สร้างโน้ตใหม่ |
| **Inbox.jsx** | `DELETE /api/notes/:id` | ลบโน้ต |
| **Log.jsx** | `GET /api/logs` | ดึง log ทั้งหมด (มี filter) |
| **Notification.jsx** | `GET /api/notifications` | ดึงการแจ้งเตือน |
| **Notification.jsx** | `PUT /api/notifications/:id/read` | อ่านแจ้งเตือนแล้ว |
| **Account.jsx** | `GET /api/users/me` | ดึงข้อมูลโปรไฟล์ |
| **Account.jsx** | `PUT /api/users/me/username` | เปลี่ยน username |
| **Account.jsx** | `PUT /api/users/me/email` | เปลี่ยน email |
| **Account.jsx** | `PUT /api/users/me/phone` | เปลี่ยนเบอร์โทร |
| **Account.jsx** | `PUT /api/users/me/password` | เปลี่ยนรหัสผ่าน |
| **Account.jsx** | `PUT /api/users/me/avatar` | อัพรูปโปรไฟล์ |
| **Connect.jsx** | `GET /api/api-keys` | ดึง API keys |
| **Connect.jsx** | `POST /api/api-keys` | สร้าง key ใหม่ |
| **Connect.jsx** | `PUT /api/api-keys/:id/toggle` | เปิด/ปิด key |
| **Connect.jsx** | `POST /api/api-keys/reset-personal` | รีเซ็ต key |
| **Member.jsx** | `GET /api/users` | ดึงรายชื่อสมาชิกทั้งหมด |
| **Member.jsx** | `DELETE /api/users/:id` | ลบสมาชิก |

### 5.2 ตัวอย่างโค้ด Frontend ที่เรียก API (ที่สำคัญ)

#### Login (SignInPage.jsx)
```javascript
const res = await fetch("/api/users/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identifier, password }),
});
// ได้ token → เก็บใน sessionStorage
```

#### ดึงข้อมูลลูกค้า + ข้อความ (ChatContext.jsx)
```javascript
const [custRes, msgRes] = await Promise.all([
  fetch("/api/customers", { headers: getHeaders() }),
  fetch("/api/messages", { headers: getHeaders() }),
]);
```

#### ส่งข้อความ (ChatContext.jsx)
```javascript
await fetch("/api/messages", {
  method: "POST",
  headers: getHeaders(),  // มี Authorization: Bearer <token>
  body: JSON.stringify({
    customer_id: customerId,
    sender: "own",
    message_type: "text",
    message_text: text,
    socket_id: socketRef.current?.id || null,
  }),
});
```

#### ดึง Log (Log.jsx)
```javascript
const res = await fetch(`/api/logs?${params.toString()}`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

### 5.3 สิ่งที่ต้องอธิบายได้

1. **Token มาจากไหน?** → Login สำเร็จ → เก็บใน `sessionStorage`
2. **ส่ง Token ยังไง?** → ใส่ใน Header: `Authorization: Bearer <token>`
3. **ถ้า Token หมดอายุ?** → API ส่ง 401 → frontend ควร redirect ไป login
4. **Real-time ทำงานยังไง?** → Socket.IO events: `new-message`, `new-customer`, `new-log`, `user-status-changed`
