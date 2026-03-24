const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController.js');

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: การจัดการแม่แบบข้อความ (Templates)
 */

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: สร้าง Template ใหม่
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               content:
 *                 type: object
 *               created_by:
 *                 type: integer
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบ
 */
// สร้าง Template ใหม่
router.post('/', templateController.createTemplate);

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: ดึง Template ทั้งหมด
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
// ดึง Template ทั้งหมด
router.get('/', templateController.getAllTemplates);

/**
 * @swagger
 * /api/templates/type/{type}:
 *   get:
 *     summary: ดึง Template ตามประเภท
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: สำเร็จ
 */
// ดึง Template ตามประเภท
router.get('/type/:type', templateController.getTemplatesByType);

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: ดึง Template ตาม ID
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: สำเร็จ
 *       404:
 *         description: ไม่พบ Template
 */
// ดึง Template ตาม ID
router.get('/:id', templateController.getTemplateById);

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: อัพเดท Template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               content:
 *                 type: object
 *     responses:
 *       200:
 *         description: อัพเดทสำเร็จ
 */
// อัพเดท Template
router.put('/:id', templateController.updateTemplate);

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: ลบ Template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 */
// ลบ Template
router.delete('/:id', templateController.deleteTemplate);

/**
 * @swagger
 * /api/templates/image/{id}/{index}:
 *   get:
 *     summary: ดึงรูปภาพของ Template เพื่อนำไปส่ง LINE
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: สำเร็จ ส่งเป็นไฟล์รูปภาพ
 */
// ดึง รูปภาพของ Template (สำหรับส่ง LINE หรือแสดงผลภายนอก)
router.get('/image/:id/:index', templateController.getTemplateImage);

module.exports = router;
