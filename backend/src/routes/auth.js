const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hashed, role: role || 'MEMBER' } });
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A member with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
