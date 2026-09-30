const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

const FINE_PER_DAY = 0.5; // dollars per day overdue

// GET /api/loans - list circulation activity
router.get('/', async (req, res) => {
  try {
    const loans = await prisma.loan.findMany({
      include: { user: { select: { id: true, name: true, email: true } }, book: true, fine: true },
      orderBy: { borrowedAt: 'desc' }
    });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/loans/borrow
// body: { userId, bookId, days }
router.post('/borrow', async (req, res) => {
  const { userId, bookId, days } = req.body;
  if (!userId || !bookId) return res.status(400).json({ error: 'Missing userId or bookId' });
  const loanDays = Number(days) || 14;
  try {
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    if (book.copies < 1) return res.status(400).json({ error: 'No copies available' });

    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + loanDays);

    const loan = await prisma.loan.create({
      data: {
        userId,
        bookId,
        dueAt: due,
      }
    });

    await prisma.book.update({ where: { id: bookId }, data: { copies: { decrement: 1 } } });

    res.json(loan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/loans/return
// body: { loanId }
router.post('/return', async (req, res) => {
  const { loanId } = req.body;
  if (!loanId) return res.status(400).json({ error: 'Missing loanId' });
  try {
    const loan = await prisma.loan.findUnique({ where: { id: loanId }, include: { book: true } });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.returnedAt) return res.status(400).json({ error: 'Already returned' });

    const now = new Date();
    const updates = { returnedAt: now, status: 'RETURNED' };

    // determine overdue
    let fineRecord = null;
    if (loan.dueAt && now > loan.dueAt) {
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysOver = Math.ceil((now - loan.dueAt) / msPerDay);
      const amount = Number((daysOver * FINE_PER_DAY).toFixed(2));
      const updatedLoan = await prisma.loan.update({ where: { id: loanId }, data: updates });
      fineRecord = await prisma.fine.create({ data: { loanId: loanId, amount } });
      // increment book copies
      await prisma.book.update({ where: { id: loan.bookId }, data: { copies: { increment: 1 } } });
      return res.json({ loan: updatedLoan, fine: fineRecord });
    }

    const updatedLoan = await prisma.loan.update({ where: { id: loanId }, data: updates });
    await prisma.book.update({ where: { id: loan.bookId }, data: { copies: { increment: 1 } } });
    res.json({ loan: updatedLoan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/loans/user/:userId
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const loans = await prisma.loan.findMany({ where: { userId }, include: { book: true, fine: true } });
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
