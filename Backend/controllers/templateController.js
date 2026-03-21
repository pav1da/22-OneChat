const Template = require('../models/template');
const Log = require('../models/log');

// ช่วยแปลง user id ชั่วคราว (หรือจะรับจาก req.user ถ้ามี auth)
const getUsername = (req) => req.user?.username || req.body.username || 'Admin';

// สร้าง Template ใหม่
exports.createTemplate = async (req, res) => {
    try {
        const { name, type, content, created_by } = req.body;

        if (!name || !type || !content) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลให้ครบถ้วน (name, type, content)' });
        }

        const insertId = await Template.create({ name, type, content, created_by });

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
        console.error('Error in getAllTemplates:', error);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

// ดึง Template ตาม ID
exports.getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await Template.findById(id);

        if (!template) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบ Template ที่ต้องการ' });
        }

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
