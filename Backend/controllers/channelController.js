const Channel = require('../models/channel.js');
const Log = require('../models/log.js');
const lineController = require('./lineController.js');

const getUsername = (req) => req.user?.username || 'Admin';

// GET /api/channels — ดึงทั้งหมด
exports.getAllChannels = async (req, res) => {
    try {
        const channels = await Channel.findAll();
        res.json({ status: 'success', data: channels });
    } catch (err) {
        console.error('getAllChannels error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
};

// GET /api/channels/:id — ดึงตาม ID
exports.getChannelById = async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ status: 'error', message: 'ไม่พบช่องทาง' });
        res.json({ status: 'success', data: channel });
    } catch (err) {
        console.error('getChannelById error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
};

// POST /api/channels — สร้างใหม่
exports.createChannel = async (req, res) => {
    try {
        const { platform, channel_name, channel_id, access_token, channel_secret, webhook_url, destination_id } = req.body;
        if (!platform || !channel_name) {
            return res.status(400).json({ status: 'error', message: 'กรุณาระบุ platform และ channel_name' });
        }
        const created_by = req.user?.emp_id || null;
        const insertId = await Channel.create({ platform, channel_name, channel_id, access_token, channel_secret, webhook_url, destination_id, created_by });

        await Log.create({
            user: getUsername(req),
            avatar: '',
            action: 'Connect Channel',
            target: platform.toUpperCase(),
            details: `เชื่อมต่อช่องทาง ${platform}: ${channel_name}`
        });

        // ล้าง cache เพื่อให้การตั้งค่าใหม่มีผลทันที
        if (platform === 'line' && destination_id) {
            lineController.clearCache(destination_id);
        }

        res.status(201).json({ status: 'success', message: 'เชื่อมต่อสำเร็จ', id: insertId });
    } catch (err) {
        console.error('createChannel error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
};

// PUT /api/channels/:id — แก้ไข
exports.updateChannel = async (req, res) => {
    try {
        const { channel_name, channel_id, access_token, channel_secret, webhook_url, destination_id } = req.body;
        if (!channel_name) {
            return res.status(400).json({ status: 'error', message: 'กรุณาระบุ channel_name' });
        }
        await Channel.update(req.params.id, { channel_name, channel_id, access_token, channel_secret, webhook_url, destination_id });

        await Log.create({
            user: getUsername(req),
            avatar: '',
            action: 'Update Channel',
            target: 'Channel Management',
            details: `แก้ไขช่องทาง ID ${req.params.id}: ${channel_name}`
        });

        // ล้าง cache เพื่อให้การแก้ไขมีผลทันที
        if (destination_id) {
            lineController.clearCache(destination_id);
        } else {
            // ถ้าไม่รู้ destination เจาะจง ให้ล้างทั้งหมด (เผื่อเปลี่ยน destination_id)
            lineController.clearCache();
        }

        res.json({ status: 'success', message: 'แก้ไขสำเร็จ' });
    } catch (err) {
        console.error('updateChannel error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
};

// PUT /api/channels/:id/toggle — เปิด/ปิด
exports.toggleChannel = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'status ต้องเป็น active หรือ inactive' });
        }
        await Channel.toggleStatus(req.params.id, status);
        
        // ล้าง cache เมื่อมีการเปิด/ปิด channel
        const ch = await Channel.findById(req.params.id);
        if (ch && ch.platform === 'line' && ch.destination_id) {
            lineController.clearCache(ch.destination_id);
        }

        res.json({ status: 'success', message: `เปลี่ยนสถานะเป็น ${status} สำเร็จ` });
    } catch (err) {
        console.error('toggleChannel error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
};

// DELETE /api/channels/:id — ลบ
exports.deleteChannel = async (req, res) => {
    try {
        const channel = await Channel.findById(req.params.id);
        if (!channel) return res.status(404).json({ status: 'error', message: 'ไม่พบช่องทาง' });

        await Channel.deleteById(req.params.id);

        await Log.create({
            user: getUsername(req),
            avatar: '',
            action: 'Delete Channel',
            target: channel.platform.toUpperCase(),
            details: `ลบช่องทาง ${channel.platform}: ${channel.channel_name}`
        });

        res.json({ status: 'success', message: 'ลบสำเร็จ' });
    } catch (err) {
        console.error('deleteChannel error:', err);
        res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาด' });
    }
};
