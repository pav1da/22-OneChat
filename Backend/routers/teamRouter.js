// =============================================
// Team Router
// เส้นทาง API สำหรับจัดการทีม + สมาชิกในทีม
// ใช้ในหน้า Team (Frontend)
// =============================================

const express = require("express");
const router = express.Router();
const pool = require("../config/db.js");
const auth = require("../middleware/auth.js");
const authorize = require("../middleware/authorize.js");

// ============================================================
//  Swagger Component Schemas
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         team_id:
 *           type: integer
 *           example: 1
 *         team_name:
 *           type: string
 *           example: "ทีมขาย"
 *         created_at:
 *           type: string
 *           example: "2026-04-06 12:00:00"
 *         members:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TeamMember'
 *     TeamMember:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         team_id:
 *           type: integer
 *           example: 1
 *         emp_id:
 *           type: integer
 *           example: 5
 *         role_in_team:
 *           type: string
 *           example: "สมาชิก"
 *         joined_at:
 *           type: string
 *           example: "2026-04-06 12:00:00"
 *         username:
 *           type: string
 *           example: "somchai"
 *         display_name:
 *           type: string
 *           example: "Somchai"
 *         email:
 *           type: string
 *           example: "somchai@test.com"
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "0800000001"
 *         role:
 *           type: string
 *           example: "staff"
 *         image:
 *           type: string
 *           nullable: true
 *           example: "/uploads/avatars/avatar1.jpg"
 *         is_online:
 *           type: integer
 *           example: 1
 */

// ============================================================
//  Tags
// ============================================================

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: จัดการทีม + สมาชิกในทีม
 */

// ============================================================
//  Routes
// ============================================================

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: ดึงทีมทั้งหมด + สมาชิกในแต่ละทีม
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ — ส่งรายชื่อทีมทั้งหมดพร้อมสมาชิก
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       500:
 *         description: Server error
 */
// GET /api/teams — ดึงข้อมูลทีมทั้งหมดพร้อมรายชื่อสมาชิกในแต่ละทีม
router.get("/", auth, async (req, res) => {
  try {
    // 1. ดึงทีมทั้งหมด
    const [teams] = await pool.query(
      "SELECT * FROM teams ORDER BY created_at ASC"
    );

    // 2. ดึงสมาชิกทั้งหมดพร้อม JOIN ข้อมูลจาก EMP (ใช้ e.* แล้ว filter password ออกเหมือน membersRouter)
    const [allMembersRaw] = await pool.query(
      `SELECT tm.id, tm.team_id, tm.emp_id, tm.role_in_team, tm.joined_at,
              e.*
       FROM team_members tm
       JOIN EMP e ON tm.emp_id = e.emp_id
       ORDER BY tm.joined_at ASC`
    );
    const allMembers = allMembersRaw.map(({ password, ...rest }) => rest);

    // 3. จับคู่สมาชิกเข้ากับทีม
    const result = teams.map((team) => ({
      ...team,
      members: allMembers.filter((m) => m.team_id === team.team_id),
    }));

    res.json(result);
  } catch (err) {
    console.error("GetAllTeams error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลทีม" });
  }
});

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: สร้างทีมใหม่
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team_name
 *             properties:
 *               team_name:
 *                 type: string
 *                 example: "ทีมขาย"
 *     responses:
 *       201:
 *         description: สร้างทีมสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 *       400:
 *         description: ไม่ได้ระบุชื่อทีม
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       500:
 *         description: Server error
 */
// POST /api/teams — สร้างทีมใหม่ (Admin/Manager เท่านั้น)
router.post("/", auth, authorize("admin", "manager"), async (req, res) => {
  try {
    const { team_name } = req.body;
    if (!team_name || !team_name.trim()) {
      return res.status(400).json({ message: "กรุณาระบุชื่อทีม" });
    }

    const [result] = await pool.query(
      "INSERT INTO teams (team_name) VALUES (?)",
      [team_name.trim()]
    );

    const [newTeam] = await pool.query(
      "SELECT * FROM teams WHERE team_id = ?",
      [result.insertId]
    );

    res.status(201).json({ ...newTeam[0], members: [] });
  } catch (err) {
    console.error("CreateTeam error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างทีม" });
  }
});

/**
 * @swagger
 * /api/teams/available-members:
 *   get:
 *     summary: ดึงรายชื่อ EMP ทั้งหมด (สำหรับเลือกเพิ่มเข้าทีม)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ
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
// GET /api/teams/available-members — ดึงรายชื่อพนักงานทั้งหมดที่สามารถเพิ่มเข้าทีมได้
router.get("/available-members", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM EMP ORDER BY display_name ASC"
    );
    // ลบ password ออกก่อนส่งกลับ (เหมือน membersRouter)
    const members = rows.map(({ password, ...rest }) => rest);
    res.json(members);
  } catch (err) {
    console.error("GetAvailableMembers error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงรายชื่อสมาชิก" });
  }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: เปลี่ยนชื่อทีม
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสทีม (team_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - team_name
 *             properties:
 *               team_name:
 *                 type: string
 *                 example: "ทีมขายใหม่"
 *     responses:
 *       200:
 *         description: เปลี่ยนชื่อสำเร็จ
 *       400:
 *         description: ไม่ได้ระบุชื่อทีม
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       404:
 *         description: ไม่พบทีม
 *       500:
 *         description: Server error
 */
// PUT /api/teams/:id — แก้ไขข้อมูลทีม (เช่น เปลี่ยนชื่อทีม)
router.put("/:id", auth, authorize("admin", "manager"), async (req, res) => {
  try {
    const { team_name } = req.body;
    if (!team_name || !team_name.trim()) {
      return res.status(400).json({ message: "กรุณาระบุชื่อทีม" });
    }

    const [result] = await pool.query(
      "UPDATE teams SET team_name = ? WHERE team_id = ?",
      [team_name.trim(), req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบทีม" });
    }

    res.json({ message: "เปลี่ยนชื่อทีมสำเร็จ" });
  } catch (err) {
    console.error("UpdateTeam error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเปลี่ยนชื่อทีม" });
  }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: ลบทีม (cascade ลบสมาชิกด้วย)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสทีม (team_id)
 *     responses:
 *       200:
 *         description: ลบทีมสำเร็จ
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       404:
 *         description: ไม่พบทีม
 *       500:
 *         description: Server error
 */
// DELETE /api/teams/:id — ลบทีมออกจากระบบ
router.delete("/:id", auth, authorize("admin", "manager"), async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM teams WHERE team_id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบทีม" });
    }

    res.json({ message: "ลบทีมสำเร็จ" });
  } catch (err) {
    console.error("DeleteTeam error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบทีม" });
  }
});

/**
 * @swagger
 * /api/teams/{id}/members:
 *   post:
 *     summary: เพิ่มสมาชิกเข้าทีม
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสทีม (team_id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emp_id
 *             properties:
 *               emp_id:
 *                 type: integer
 *                 example: 5
 *               role_in_team:
 *                 type: string
 *                 example: "สมาชิก"
 *     responses:
 *       201:
 *         description: เพิ่มสมาชิกสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamMember'
 *       400:
 *         description: ไม่ได้ระบุ emp_id หรือสมาชิกอยู่ในทีมแล้ว
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       404:
 *         description: ไม่พบทีม
 *       500:
 *         description: Server error
 */
// POST /api/teams/:id/members — เพิ่มสมาชิกใหม่เข้าไปในทีม
router.post("/:id/members", auth, authorize("admin", "manager"), async (req, res) => {
  try {
    const teamId = req.params.id;
    const { emp_id, role_in_team = "สมาชิก" } = req.body;

    if (!emp_id) {
      return res.status(400).json({ message: "กรุณาระบุ emp_id" });
    }

    // ตรวจสอบว่าทีมมีอยู่จริง
    const [team] = await pool.query(
      "SELECT * FROM teams WHERE team_id = ?",
      [teamId]
    );
    if (team.length === 0) {
      return res.status(404).json({ message: "ไม่พบทีม" });
    }

    // เพิ่มสมาชิก (UNIQUE KEY จะป้องกันซ้ำให้)
    await pool.query(
      "INSERT INTO team_members (team_id, emp_id, role_in_team) VALUES (?, ?, ?)",
      [teamId, emp_id, role_in_team]
    );

    // ดึงข้อมูลสมาชิกที่เพิ่มใหม่พร้อม JOIN EMP
    const [newMemberRaw] = await pool.query(
      `SELECT tm.id, tm.team_id, tm.emp_id, tm.role_in_team, tm.joined_at,
              e.*
       FROM team_members tm
       JOIN EMP e ON tm.emp_id = e.emp_id
       WHERE tm.team_id = ? AND tm.emp_id = ?`,
      [teamId, emp_id]
    );
    const { password, ...newMember } = newMemberRaw[0];

    res.status(201).json(newMember);
  } catch (err) {
    // Duplicate entry = สมาชิกอยู่ในทีมแล้ว
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "สมาชิกอยู่ในทีมนี้แล้ว" });
    }
    console.error("AddTeamMember error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มสมาชิก" });
  }
});

/**
 * @swagger
 * /api/teams/{id}/members/{empId}:
 *   delete:
 *     summary: ลบสมาชิกออกจากทีม
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสทีม (team_id)
 *       - in: path
 *         name: empId
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสพนักงาน (emp_id)
 *     responses:
 *       200:
 *         description: ลบสมาชิกออกจากทีมสำเร็จ
 *       401:
 *         description: ไม่พบ Token / Token หมดอายุ
 *       404:
 *         description: ไม่พบสมาชิกในทีม
 *       500:
 *         description: Server error
 */
// DELETE /api/teams/:id/members/:empId — ลบสมาชิกออกจากทีม
router.delete("/:id/members/:empId", auth, authorize("admin", "manager"), async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM team_members WHERE team_id = ? AND emp_id = ?",
      [req.params.id, req.params.empId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบสมาชิกในทีม" });
    }

    res.json({ message: "ลบสมาชิกออกจากทีมสำเร็จ" });
  } catch (err) {
    console.error("RemoveTeamMember error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสมาชิก" });
  }
});


module.exports = router;
