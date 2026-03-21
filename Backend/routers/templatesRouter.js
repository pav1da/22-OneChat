const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');

// สร้าง Template ใหม่
router.post('/', templateController.createTemplate);

// ดึง Template ทั้งหมด
router.get('/', templateController.getAllTemplates);

// ดึง Template ตามประเภท
router.get('/type/:type', templateController.getTemplatesByType);

// ดึง Template ตาม ID
router.get('/:id', templateController.getTemplateById);

// อัพเดท Template
router.put('/:id', templateController.updateTemplate);

// ลบ Template
router.delete('/:id', templateController.deleteTemplate);

module.exports = router;
