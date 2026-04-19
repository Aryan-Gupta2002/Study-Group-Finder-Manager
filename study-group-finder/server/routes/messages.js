const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// helper — check if student is a member of the group
async function isMember(group_id, student_id) {
    const [rows] = await pool.query(
        'SELECT 1 FROM group_members WHERE group_id = ? AND student_id = ?',
        [group_id, student_id]
    );
    return rows.length > 0;
}

// GET /api/messages/:group_id — fetch all messages in a group
router.get('/:group_id', authMiddleware, async (req, res) => {
    const { group_id } = req.params;
    const student_id = req.user.student_id;
    try {
        if (!(await isMember(group_id, student_id)))
        return res.status(403).json({ error: 'You are not a member of this group' });

        const [rows] = await pool.query(
        `SELECT m.message_id, m.content, m.sent_at,
                s.name AS sender_name
        FROM messages m
        JOIN students s ON m.sender_id = s.student_id
        WHERE m.group_id = ?
        ORDER BY m.sent_at ASC`,
        [group_id]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/messages/:group_id — send a message
router.post('/:group_id', authMiddleware, async (req, res) => {
    const { group_id } = req.params;
    const { content } = req.body;
    const sender_id = req.user.student_id;
    try {
        if (!(await isMember(group_id, sender_id)))
        return res.status(403).json({ error: 'You are not a member of this group' });

        if (!content?.trim())
        return res.status(400).json({ error: 'Message cannot be empty' });

        const [result] = await pool.query(
        'INSERT INTO messages (group_id, sender_id, content) VALUES (?, ?, ?)',
        [group_id, sender_id, content.trim()]
        );
        res.status(201).json({ message_id: result.insertId, message: 'Sent' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;