const express = require('express');
const router = express.Router();
const Tag = require('../models/tag.js');
const Customer = require('../models/customer.js');
const Log = require('../models/log.js');
const auth = require('../middleware/auth.js');

// Helper: สร้างวันที่เวลาแบบ MySQL format
const getLocalDatetime = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// ============================================================
// CUSTOMER TAG ROUTES — ต้องอยู่บน GLOBAL ROUTES เสมอ
// เพื่อป้องกัน Express จับ "customer" ไปเป็น /:id
// ============================================================

// GET /api/tags/customers/all — batch: ดึงแท็กของลูกค้าทุกคนในครั้งเดียว (สำหรับ AllChat)
router.get('/customers/all', auth, async (req, res) => {
  try {
    const map = await Tag.findAllCustomerTagMap();
    res.json(map);
  } catch (err) {
    console.error('Get all customer tags error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/tags/customer/:customerId — ดึงแท็กที่ลูกค้าคนนี้มีอยู่
router.get('/customer/:customerId', auth, async (req, res) => {
  try {
    const tags = await Tag.findTagsByCustomerId(req.params.customerId);
    res.json(tags);
  } catch (err) {
    console.error('Get customer tags error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงแท็ก' });
  }
});

// POST /api/tags/customer/:customerId — ติดแท็กให้ลูกค้า (findOrCreate global tag)
router.post('/customer/:customerId', auth, async (req, res) => {
  try {
    const { text, color } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อแท็ก' });
    }

    const customerId = req.params.customerId;

    // 1. ค้นหา global tag ที่มีชื่อเดียวกัน หรือสร้างใหม่
    let tag = await Tag.findByText(text.trim());
    if (!tag) {
      const newId = await Tag.createGlobalTag(text.trim(), color || '#6b7280');
      tag = { id: newId, text: text.trim(), color: color || '#6b7280' };

      // บันทึก Log การสร้างแท็กใหม่ (เพราะเป็นการสร้างขึ้นบนฟลายระหว่างแชท)
      try {
        const adminName = req.user?.username || "unknown";
        const logDataCreate = {
          user: adminName,
          avatar: null,
          action: "สร้างแท็กส่วนกลาง",
          target: text.trim(),
          details: `สี: ${color || '#6b7280'} (สร้างจากห้องแชท)`,
        };
        const logResultCreate = await Log.create(logDataCreate);
        const ioCreate = req.app.get("io");
        if (ioCreate) {
          ioCreate.emit("new-log", {
            ...logDataCreate,
            log_id: logResultCreate.insertId,
            created_at: getLocalDatetime(),
          });
        }
      } catch (logErr) {
        console.error("Tag create log error:", logErr.message);
      }
    }

    // 2. ผูกแท็กนี้เข้ากับลูกค้า
    await Tag.addTagToCustomer(customerId, tag.id);

    // 3. Broadcast real-time ให้ client อื่นรู้ (เช่น Allchat)
    const io = req.app.get('io');
    if (io) {
      io.emit('customer-tags-updated', { customer_id: Number(customerId) });
    }

    // บันทึก Log การเพิ่มแท็กให้ลูกค้า
    try {
      const customer = await Customer.findById(customerId);
      const customerName = customer?.cus_name || `Customer #${customerId}`;
      const adminName = req.user?.username || "unknown";
      
      const logData = {
        user: adminName,
        avatar: null,
        action: "ติดแท็ก",
        target: customerName,
        details: `เพิ่มแท็ก: ${tag.text}`,
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
      console.error("Tag log error:", logErr.message);
    }

    res.status(201).json({ id: tag.id, text: tag.text, color: tag.color });
  } catch (err) {
    console.error('Add tag to customer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/tags/customer/:customerId/:tagId — ถอดแท็กออกจากลูกค้า
router.delete('/customer/:customerId/:tagId', auth, async (req, res) => {
  try {
    const { customerId, tagId } = req.params;
    const tag = await Tag.findById(tagId);
    
    const success = await Tag.removeTagFromCustomer(customerId, tagId);
    if (!success) return res.status(404).json({ message: 'ไม่พบข้อมูล' });

    const io = req.app.get('io');
    if (io) {
      io.emit('customer-tags-updated', { customer_id: Number(customerId) });
    }

    // บันทึก Log การถอดแท็กจากลูกค้า
    try {
      const customer = await Customer.findById(customerId);
      const customerName = customer?.cus_name || `Customer #${customerId}`;
      const adminName = req.user?.username || "unknown";
      const tagName = tag ? tag.text : `ID: ${tagId}`;
      
      const logData = {
        user: adminName,
        avatar: null,
        action: "ถอดแท็ก",
        target: customerName,
        details: `นำแท็กออก: ${tagName}`,
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
      console.error("Tag log error:", logErr.message);
    }

    res.json({ message: 'ลบแท็กออกสำเร็จ' });
  } catch (err) {
    console.error('Remove tag from customer error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// ============================================================
// GLOBAL TAG ROUTES (สำหรับหน้า Setting > จัดการแท็ก)
// ============================================================

// GET /api/tags — ดึงแท็กส่วนกลางทั้งหมดพร้อมจำนวน
router.get('/', auth, async (req, res) => {
  try {
    const tags = await Tag.findAllGlobalTags();
    res.json(tags);
  } catch (err) {
    console.error('Get global tags error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงแท็ก' });
  }
});

// POST /api/tags — สร้างแท็กส่วนกลางใหม่จาก Settings
router.post('/', auth, async (req, res) => {
  try {
    const { text, color } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อแท็ก' });
    }

    const existing = await Tag.findByText(text.trim());
    if (existing) {
      return res.status(409).json({ message: 'แท็กชื่อนี้มีอยู่แล้ว', tag: existing });
    }

    const id = await Tag.createGlobalTag(text.trim(), color || '#6b7280');

    // บันทึก Log การสร้างแท็กใหม่เข้าระบบ
    try {
      const adminName = req.user?.username || "unknown";
      const logData = {
        user: adminName,
        avatar: null,
        action: "สร้างแท็กส่วนกลาง",
        target: text.trim(),
        details: `สี: ${color || '#6b7280'}`,
      };
      const logResult = await Log.create(logData);
      
      const io = req.app.get("io");
      if (io) {
        io.emit("new-log", {
          ...logData,
          log_id: logResult.insertId,
          created_at: getLocalDatetime(),
        });
      }
    } catch (logErr) {
      console.error("Tag log error:", logErr.message);
    }

    res.status(201).json({ id, text: text.trim(), color: color || '#6b7280', count: 0 });
  } catch (err) {
    console.error('Create global tag error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// PUT /api/tags/:id — แก้ไขชื่อ/สีแท็ก
router.put('/:id', auth, async (req, res) => {
  try {
    const { text, color } = req.body;
    if (!text?.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อแท็ก' });
    }

    const success = await Tag.updateGlobalTag(req.params.id, text.trim(), color);
    if (!success) return res.status(404).json({ message: 'ไม่พบแท็ก' });

    // บันทึก Log การแก้ไขแท็กระบบ
    try {
      const adminName = req.user?.username || "unknown";
      const logData = {
        user: adminName,
        avatar: null,
        action: "แก้ไขแท็กส่วนกลาง",
        target: text.trim(),
        details: `แก้ไขชื่อหรือสีเป็น: ${color}`,
      };
      const logResult = await Log.create(logData);
      
      const io = req.app.get("io");
      if (io) {
        io.emit("new-log", {
          ...logData,
          log_id: logResult.insertId,
          created_at: getLocalDatetime(),
        });
      }
    } catch (logErr) {
      console.error("Tag log error:", logErr.message);
    }

    res.json({ message: 'อัปเดตแท็กสำเร็จ' });
  } catch (err) {
    console.error('Update global tag error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// DELETE /api/tags/:id — ลบแท็กส่วนกลาง (CASCADE ลบ customer_tags ด้วย)
router.delete('/:id', auth, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    const success = await Tag.deleteGlobalTag(req.params.id);
    if (!success) return res.status(404).json({ message: 'ไม่พบแท็ก' });

    const io = req.app.get('io');
    if (io) {
      io.emit('global-tag-deleted', { tag_id: Number(req.params.id) });
    }

    // บันทึก Log การลบแท็กทิ้งแบบถาวร
    try {
      const adminName = req.user?.username || "unknown";
      const tagName = tag ? tag.text : `ID: ${req.params.id}`;
      const logData = {
        user: adminName,
        avatar: null,
        action: "ลบแท็กส่วนกลางแบบถาวร",
        target: tagName,
        details: "ปลดการเชื่อมโยงจากลูกค้าทุกคนที่ใช้อยู่",
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
      console.error("Tag log error:", logErr.message);
    }

    res.json({ message: 'ลบแท็กสำเร็จ' });
  } catch (err) {
    console.error('Delete global tag error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

module.exports = router;
