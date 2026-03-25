const Note = require('../models/note.js');
const Log = require('../models/log.js');

// Helper แปลงชื่อผู้ใช้งานที่ทำการ Request
const getAdminName = (req) => req.user?.username || req.body.admin_name || 'Admin';

// 1. สร้าง Note ใหม่
exports.createNote = async (req, res) => {
    try {
        const { user, content, created_by } = req.body;

        if (!user || !content) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูล เขียนถึง(user) และ รายละเอียด(content) ให้ครบถ้วน' });
        }

        const insertId = await Note.create({ user, content, created_by });
        
        // บันทึก Log
        await Log.create({
            user: getAdminName(req),
            avatar: '',
            action: 'Create Note',
            target: 'Notes Management',
            details: `Created a note for user: ${user}`
        });

        // ดึงข้อมูล Note รูปแบบเต็มกลับมาเพื่อใช้ Broadcast
        const newNote = await Note.findById(insertId);

        // กระจาย Event ให้ Frontend อัปเดตผ่าน Socket.IO
        const io = req.app.get('io');
        if (io) {
            io.emit('new_note', newNote);
        }

        res.status(201).json({ status: 'success', message: 'สร้างโน้ตสำเร็จ', data: newNote });
    } catch (error) {
        console.error('Error in createNote:', error);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการสร้างโน้ต' });
    }
};

// 2. ดึงข้อมูล Note ทั้งหมด
exports.getAllNotes = async (req, res) => {
    try {
        const notes = await Note.findAll();
        res.status(200).json({ status: 'success', data: notes });
    } catch (error) {
        console.error('Error in getAllNotes:', error);
        res.status(500).json({ status: 'error', message: 'เซิร์ฟเวอร์เกิดข้อผิดพลาดในการดึงข้อมูลโน้ต' });
    }
};

// 3. ดึงข้อมูล Note จาก ID
exports.getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await Note.findById(id);

        if (!note) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบโน้ตที่ระบุ' });
        }
        res.status(200).json({ status: 'success', data: note });
    } catch (error) {
        console.error('Error in getNoteById:', error);
        res.status(500).json({ status: 'error', message: 'เซิร์ฟเวอร์เกิดข้อผิดพลาดในการดึงข้อมูลโน้ต' });
    }
};

// 4. แก้ไข Note
exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { user, content } = req.body;

        if (!user || !content) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูล เขียนถึง(user) และ รายละเอียด(content) ให้ครบถ้วน' });
        }

        const success = await Note.update(id, { user, content });

        if (!success) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบโน้ตที่ต้องการแก้ไข' });
        }

        // บันทึก Log
        await Log.create({
            user: getAdminName(req),
            avatar: '',
            action: 'Update Note',
            target: 'Notes Management',
            details: `Updated note ID: ${id}`
        });

        const updatedNote = await Note.findById(id);

        // แจ้งเตือนผ่าน Socket
        const io = req.app.get('io');
        if (io) {
            io.emit('updated_note', updatedNote);
        }

        res.status(200).json({ status: 'success', message: 'แก้ไขโน้ตสำเร็จ', data: updatedNote });
    } catch (error) {
        console.error('Error in updateNote:', error);
        res.status(500).json({ status: 'error', message: 'เซิร์ฟเวอร์เกิดข้อผิดพลาดในการแก้ไขโน้ต' });
    }
};

// 5. ลบ Note
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await Note.deleteById(id);

        if (!success) {
            return res.status(404).json({ status: 'error', message: 'ไม่พบโน้ตที่ต้องการลบ' });
        }

        // บันทึก Log
        await Log.create({
            user: getAdminName(req),
            avatar: '',
            action: 'Delete Note',
            target: 'Notes Management',
            details: `Deleted note ID: ${id}`
        });

        // แจ้งเตือน Socket ให้ Frontend ลบทิ้งออกแบบ Real-time
        const io = req.app.get('io');
        if (io) {
            io.emit('deleted_note', { id: parseInt(id) });
        }

        res.status(200).json({ status: 'success', message: 'ลบโน้ตสำเร็จ' });
    } catch (error) {
        console.error('Error in deleteNote:', error);
        res.status(500).json({ status: 'error', message: 'เซิร์ฟเวอร์เกิดข้อผิดพลาดในการลบโน้ต' });
    }
};
