const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const fetch = require('node-fetch');

// GET /api/books - list books from DB
router.get('/', async (req, res) => {
  try {
    const books = await prisma.book.findMany({});
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/books - add a book to the library catalog
router.post('/', async (req, res) => {
  const { title, authors, isbn, coverUrl, copies } = req.body;
  const copyCount = copies === undefined ? 1 : Number(copies);

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  if (!Number.isInteger(copyCount) || copyCount < 1) {
    return res.status(400).json({ error: 'Copies must be a positive integer' });
  }

  try {
    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        authors: authors || null,
        isbn: isbn || null,
        coverUrl: coverUrl || null,
        copies: copyCount
      }
    });
    res.status(201).json(book);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A book with this ISBN already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/books/isbn/:isbn - fetch from Open Library
router.get('/isbn/:isbn', async (req, res) => {
  const { isbn } = req.params;
  try {
    const url = `https://openlibrary.org/isbn/${isbn}.json`;
    const resp = await fetch(url);
    if (!resp.ok) return res.status(404).json({ error: 'Not found in Open Library' });
    const data = await resp.json();
    const coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    res.json({ ...data, coverUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
