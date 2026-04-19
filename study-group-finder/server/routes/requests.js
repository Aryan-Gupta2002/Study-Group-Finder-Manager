const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// POST /api/requests — send a join request
router.post('/', authMiddleware, async (req, res) => {
    const { group_id } = req.body;
    const student_id = req.user.student_id;
    try {
        await pool.query(
        'INSERT INTO join_requests (group_id, student_id) VALUES (?, ?)',
        [group_id, student_id]
        );
        res.status(201).json({ message: 'Join request sent' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Request already sent' });
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/requests/incoming — group admin sees pending requests for their groups
router.get('/incoming', authMiddleware, async (req, res) => {
    const student_id = req.user.student_id;
    try {
        const [rows] = await pool.query(
        `SELECT jr.request_id, jr.status, jr.requested_at,
                s.name AS requester_name, s.email,
                sg.name AS group_name, sg.group_id
        FROM join_requests jr
        JOIN students s      ON jr.student_id = s.student_id
        JOIN study_groups sg ON jr.group_id   = sg.group_id
        WHERE sg.created_by = ? AND jr.status = 'pending'`,
        [student_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PATCH /api/requests/:request_id — accept or reject (admin only)
router.patch('/:request_id', authMiddleware, async (req, res) => {
    const { status } = req.body;  // 'accepted' or 'rejected'
    const { request_id } = req.params;
    const admin_id = req.user.student_id;

    if (!['accepted', 'rejected'].includes(status))
        return res.status(400).json({ error: 'Invalid status' });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // verify the request belongs to a group this person admins
        const [rows] = await conn.query(
        `SELECT jr.group_id, jr.student_id
        FROM join_requests jr
        JOIN study_groups sg ON jr.group_id = sg.group_id
        WHERE jr.request_id = ? AND sg.created_by = ?`,
        [request_id, admin_id]
        );
        if (!rows.length) {
        await conn.rollback();
        return res.status(403).json({ error: 'Not authorized' });
        }

        // update request status
        await conn.query(
        'UPDATE join_requests SET status = ? WHERE request_id = ?',
        [status, request_id]
        );

        // if accepted, add to group_members (trigger checks capacity automatically)
        if (status === 'accepted') {
        await conn.query(
            'INSERT INTO group_members (group_id, student_id) VALUES (?, ?)',
            [rows[0].group_id, rows[0].student_id]
        );
        }

        await conn.commit();
        res.json({ message: `Request ${status}` });
    } catch (err) {
        await conn.rollback();
        // trigger fires here if group is full
        if (err.code === 'ER_SIGNAL_EXCEPTION')
        return res.status(400).json({ error: err.sqlMessage });
        res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
});

module.exports = router;