const express  = require('express');
const pool     = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const router   = express.Router();

// GET /api/groups/subjects
router.get('/subjects', async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json(rows);
});

// GET /api/groups — fetch all active groups (uses your VIEW)
router.get('/', async (req, res) => {
    const { subject_id } = req.query;
    try {
        let query = 'SELECT * FROM active_groups_view';
        const params = [];
        if (subject_id) {
        query += ' WHERE subject_id = ?';   // extend view if needed
        params.push(subject_id);
        }
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/groups — create a group (protected)
router.post('/', authMiddleware, async (req, res) => {
    const { name, subject_id, max_size, schedule_time } = req.body;
    const created_by = req.user.student_id;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [result] = await conn.query(
        'INSERT INTO study_groups (name, subject_id, created_by, max_size, schedule_time) VALUES (?, ?, ?, ?, ?)',
        [name, subject_id, created_by, max_size, schedule_time]
        );
        const group_id = result.insertId;

        // auto-add creator as admin member
        await conn.query(
        'INSERT INTO group_members (group_id, student_id, role) VALUES (?, ?, ?)',
        [group_id, created_by, 'admin']
        );

        await conn.commit();
        res.status(201).json({ group_id, message: 'Group created' });
    } catch (err) {
        await conn.rollback();
        res.status(500).json({ error: 'Transaction failed' });
    } finally {
        conn.release();
    }
});

module.exports = router;