const Template = require('../models/template.js');
const Log = require('../models/log.js');

// --- Simple Memory Cache ---
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
let pickerCache = { data: null, timestamp: 0 };
const imageCache = new Map(); // id -> { mime, buffer, timestamp }
const fullTemplateCache = new Map(); // id -> { data, timestamp }

const clearTemplateCaches = (id = null) => {
    pickerCache.data = null;
    pickerCache.timestamp = 0;
    if (id) {
        imageCache.delete(String(id));
        fullTemplateCache.delete(String(id));
    } else {
        imageCache.clear();
        fullTemplateCache.clear();
    }
};
// -----------------------------

// ช่วยแปลง user id ชั่วคราว (หรือจะรับจาก req.user ถ้ามี auth)
const getUsername = (req) => req.user?.username || req.body?.username || 'Admin';

// สร้าง Template ใหม่
exports.createTemplate = async (req, res) => {
    try {
        const { name, type, content, created_by } = req.body;

        if (!name || !type || !content) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน (name, type, content)' });
        }

        const insertId = await Template.create({ name, type, content, created_by });
        
        clearTemplateCaches(); // Invalidate cache

        await Log.create({
            user: getUsername(req),
            avatar: '',
            action: 'Create Template',
            target: 'Template Management',
            details: `Created a new ${type} template: ${name}`
        });

        res.status(201).json({ status: 'success', message: 'สร้าง Template สำเร็จ', id: insertId });
    } catch (error) {
        console.error('Error in createTemplate:', error);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการสร้าง Template' });
    }
};

// ดึง Template ทั้งหมด
exports.getAllTemplates = async (req, res) => {
    try {
        const templates = await Template.findAll();
        res.status(200).json({ status: 'success', data: templates });
    } catch (error) {
        console.error('Error in getAllTemplates:', error.message);
        console.error('Error details:', { code: error.code, errno: error.errno, sqlState: error.sqlState, sqlMessage: error.sqlMessage });
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูล', detail: error.message });
    }
};

// ดึง Template สำหรับ TemplatePicker (ไม่รวม base64 รูป)
exports.getTemplatesForPicker = async (req, res) => {
    try {
        const now = Date.now();
        if (pickerCache.data && (now - pickerCache.timestamp < CACHE_TTL)) {
            return res.status(200).json({ status: 'success', data: pickerCache.data });
        }

        const templates = await Template.findSummaryForPicker();
        pickerCache.data = templates;
        pickerCache.timestamp = now;

        res.status(200).json({ status: 'success', data: templates });
    } catch (error) {
        console.error('Error in getTemplatesForPicker:', error.message);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

// ดึงรูป Template ตาม ID (return เป็น binary image สำหรับ <img src>)
exports.getTemplateImage = async (req, res) => {
    try {
        const { id } = req.params;
        const now = Date.now();

        // Check Cache
        if (imageCache.has(String(id))) {
            const cached = imageCache.get(String(id));
            if (now - cached.timestamp < CACHE_TTL) {
                res.set('Content-Type', cached.mime);
                res.set('Cache-Control', 'public, max-age=3600');
                return res.send(cached.buffer);
            }
        }

        const template = await Template.findById(id);
        if (!template) return res.status(404).json({ error: 'Not found' });

        const content = typeof template.content === 'string'
            ? JSON.parse(template.content)
            : template.content;

        // Resolve image data — supports single image, images[], and carousel cards[]
        const imageData = content?.image ||
            (Array.isArray(content?.images) && content.images[0]) ||
            (Array.isArray(content?.cards) && content.cards[0]?.image) ||
            '';

        if (!imageData || !String(imageData).startsWith('data:')) {
            return res.status(404).json({ error: 'No image in template' });
        }

        const [header, base64] = String(imageData).split(',');
        const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
        const buffer = Buffer.from(base64, 'base64');

        // Save to cache
        imageCache.set(String(id), { mime, buffer, timestamp: now });

        res.set('Content-Type', mime);
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(buffer);
    } catch (err) {
        console.error('Error in getTemplateImage:', err);
        res.status(500).json({ error: err.message });
    }
};

// ดึง Template ตาม ID
exports.getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const now = Date.now();

        // Check Cache
        if (fullTemplateCache.has(String(id))) {
            const cached = fullTemplateCache.get(String(id));
            if (now - cached.timestamp < CACHE_TTL) {
                return res.status(200).json({ status: 'success', data: cached.data });
            }
        }

        const template = await Template.findById(id);

        if (!template) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบ Template ที่ต้องการ' });
        }

        // Save to cache
        fullTemplateCache.set(String(id), { data: template, timestamp: now });

        res.status(200).json({ status: 'success', data: template });
    } catch (error) {
        console.error('Error in getTemplateById:', error);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

// ดึง Template ตามประเภท
exports.getTemplatesByType = async (req, res) => {
    try {
        const { type } = req.params;
        const templates = await Template.findByType(type);
        res.status(200).json({ status: 'success', data: templates });
    } catch (error) {
        console.error('Error in getTemplatesByType:', error);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

// อัพเดท Template
exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, content } = req.body;

        if (!name || !type || !content) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน (name, type, content)' });
        }

        const success = await Template.update(id, { name, type, content });

        if (!success) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบ Template ที่ต้องการอัพเดท' });
        }

        clearTemplateCaches(id); // Invalidate cache

        await Log.create({
            user: getUsername(req),
            avatar: '',
            action: 'Update Template',
            target: 'Template Management',
            details: `Updated ${type} template: ${name}`
        });

        res.status(200).json({ status: 'success', message: 'อัพเดท Template สำเร็จ' });
    } catch (error) {
        console.error('Error in updateTemplate:', error);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัพเดท Template' });
    }
};

// ลบ Template
exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await Template.deleteById(id);

        if (!success) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบ Template ที่ต้องการลบ' });
        }

        clearTemplateCaches(id); // Invalidate cache

        await Log.create({
            user: getUsername(req),
            avatar: '',
            action: 'Delete Template',
            target: 'Template Management',
            details: `Deleted template id: ${id}`
        });

        res.status(200).json({ status: 'success', message: 'ลบ Template สำเร็จ' });
    } catch (error) {
        console.error('Error in deleteTemplate:', error);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการลบ Template' });
    }
};
