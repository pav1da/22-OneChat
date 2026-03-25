const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController.js');

/**
 * @swagger
 * tags:
 *   name: Templates
 *   description: จัดการ Template ข้อความ (Buttons, Confirm, Carousel, Image Carousel)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Template:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Welcome Message"
 *         type:
 *           type: string
 *           enum: [buttons, confirm, carousel, image_carousel]
 *           example: "buttons"
 *         content:
 *           type: object
 *           description: โครงสร้าง JSON ของ template ตามประเภท
 *         created_by:
 *           type: integer
 *           nullable: true
 *           example: 1
 *         created_at:
 *           type: string
 *           example: "2026-03-24 19:00:00"
 */

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: ดึง Template ทั้งหมด
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Template'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: ดึง Template ตาม ID
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       404:
 *         description: ไม่พบ Template
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/templates/type/{type}:
 *   get:
 *     summary: ดึง Template ตามประเภท
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [buttons, confirm, carousel, image_carousel]
 *         description: ประเภทของ Template
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Template'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/templates:
 *   post:
 *     summary: สร้าง Template ใหม่
 *     tags: [Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, content]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Welcome Message"
 *               type:
 *                 type: string
 *                 enum: [buttons, confirm, carousel, image_carousel]
 *                 example: "buttons"
 *               content:
 *                 type: object
 *                 description: โครงสร้าง JSON ของ template
 *                 example:
 *                   thumbnailImageUrl: "https://example.com/image.jpg"
 *                   title: "Menu"
 *                   text: "Please select"
 *                   actions:
 *                     - type: "uri"
 *                       label: "View"
 *                       uri: "https://example.com"
 *               created_by:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: สร้างสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "สร้าง Template สำเร็จ"
 *                 id:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: กรุณากรอกข้อมูลให้ครบถ้วน
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/templates/{id}:
 *   put:
 *     summary: อัพเดท Template
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, content]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Template"
 *               type:
 *                 type: string
 *                 enum: [buttons, confirm, carousel, image_carousel]
 *                 example: "confirm"
 *               content:
 *                 type: object
 *                 description: โครงสร้าง JSON ของ template ที่แก้ไข
 *     responses:
 *       200:
 *         description: อัพเดทสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "อัพเดท Template สำเร็จ"
 *       400:
 *         description: กรุณากรอกข้อมูลให้ครบถ้วน
 *       404:
 *         description: ไม่พบ Template
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/templates/{id}:
 *   delete:
 *     summary: ลบ Template
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Template ID
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "ลบ Template สำเร็จ"
 *       404:
 *         description: ไม่พบ Template
 *       500:
 *         description: Server error
 */

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
