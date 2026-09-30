const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// GET /api/members - member records for the operations dashboard
router.get('/', async (req, res) => {
  try {
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { loans: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
