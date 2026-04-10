// =============================================
// Members Router
// เส้นทาง API สำหรับดึงข้อมูลสมาชิกจาก Database
// ใช้ในหน้า Member (Frontend)
// =============================================

const express = require("express");
const router = express.Router();
const pool = require("../config/db.js");
const auth = require("../middleware/auth.js");

// ============================================================
//  Swagger Component Schemas
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Member:
 *       type: object
 *       properties:
 *         emp_id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: "admin1"
 *         name:
 *           type: string
 *           example: "Admin One"
 *         email:
 *           type: string
 *           example: "admin@test.com"
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "0800000001"
 *         role:
 *           type: string
 *           example: "admin"
 *         image:
 *           type: string
 *           nullable: true
 *           example: "/uploads/avatars/avatar1.jpg"
 *         is_online:
 *           type: integer
 *           description: "สถานะออนไลน์ (1 = online, 0 = offline)"
 *           example: 1
 *         last_seen:
 *           type: string
 *           nullable: true
 *           description: "เวลาที่ออนไลน์ล่าสุด"
 *           example: "2026-03-24 20:00:00"
 *         created_at:
 *           type: string
 *           example: "2026-03-17 08:23:46"
 */

// ============================================================
//  Routes
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Members
 *   description: ดึงข้อมูลสมาชิกจาก Database (ใช้ในหน้า Member)
 */

/**
 * @swagger
 * /api/members/with-teams:
 *   get:
 *     summary: ดึงข้อมูลสมาชิกทั้งหมดพร้อมทีมที่สังกัด
 *     description: ดึงรายชื่อสมาชิกทั้งหมดจากตาราง EMP พร้อม JOIN ข้อมูลทีมจาก team_members + teams (รองรับหลายทีมต่อคน)
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ — ส่งรายชื่อสมาชิกทั้งหมดพร้อมข้อมูลทีม
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Member'
 *                   - type: object
 *                     properties:
 *                       teams:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             team_id:
 *                               type: integer
 *                             team_name:
 *                               type: string
 *                             role_in_team:
 *                               type: string
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       500:
 *         description: Server error
 */
router.get("/with-teams", auth, async (req, res) => {
  try {
    // ดึง EMP ทั้งหมด
    const [empRows] = await pool.query(
      "SELECT * FROM EMP ORDER BY created_at ASC"
    );

    // ดึง team memberships ทั้งหมดพร้อมชื่อทีม
    const [teamRows] = await pool.query(
      `SELECT tm.emp_id, tm.team_id, tm.role_in_team, t.team_name
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.team_id
       ORDER BY t.team_name ASC`
    );

    // สร้าง Map: emp_id -> array of teams
    const teamsByEmpId = {};
    for (const row of teamRows) {
      if (!teamsByEmpId[row.emp_id]) {
        teamsByEmpId[row.emp_id] = [];
      }
      teamsByEmpId[row.emp_id].push({
        team_id: row.team_id,
        team_name: row.team_name,
        role_in_team: row.role_in_team,
      });
    }

    // รวมข้อมูล EMP + teams แล้วลบ password ออก
    const members = empRows.map(({ password, ...rest }) => ({
      ...rest,
      teams: teamsByEmpId[rest.emp_id] || [],
    }));

    res.json(members);
  } catch (err) {
    console.error("GetMembersWithTeams error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก" });
  }
});

/**
 * @swagger
 * /api/members:
 *   get:
 *     summary: ดึงข้อมูลสมาชิกทั้งหมด
 *     description: ดึงรายชื่อสมาชิกทั้งหมดจากตาราง EMP พร้อมสถานะ online/offline (ไม่รวม password)
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ — ส่งรายชื่อสมาชิกทั้งหมด
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Member'
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       500:
 *         description: Server error
 */
router.get("/", auth, async (req, res) => {
  try {
    // ใช้ SELECT * เพื่อดึงทุก field จากตาราง EMP แล้วลบ password ออก
    const [rows] = await pool.query(
      "SELECT * FROM EMP ORDER BY created_at ASC",
    );
    // ลบ password ออกก่อนส่งกลับ
    const members = rows.map(({ password, ...rest }) => rest);
    res.json(members);
  } catch (err) {
    console.error("GetAllMembers error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก" });
  }
});

/**
 * @swagger
 * /api/members/{id}:
 *   get:
 *     summary: ดึงข้อมูลสมาชิกรายคน
 *     description: ดึงข้อมูลสมาชิกจากตาราง EMP ตาม emp_id (ไม่รวม password)
 *     tags: [Members]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "รหัสพนักงาน (emp_id)"
 *         example: 1
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Member'
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       404:
 *         description: ไม่พบสมาชิก
 *       500:
 *         description: Server error
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM EMP WHERE emp_id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบสมาชิก" });
    }
    // ลบ password ออกก่อนส่งกลับ
    const { password, ...member } = rows[0];
    res.json(member);
  } catch (err) {
    console.error("GetMemberById error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
