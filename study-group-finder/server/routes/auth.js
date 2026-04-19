const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const router = express.Router();

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query(
        'INSERT INTO students (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, hash]
        );
        res.status(201).json({ message: 'Account created' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
        return res.status(400).json({ error: 'Email already registered' });
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query(
        'SELECT * FROM students WHERE email = ?', [email]
        );
        if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, rows[0].password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
        { student_id: rows[0].student_id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
        );
        res.json({ token, name: rows[0].name });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;