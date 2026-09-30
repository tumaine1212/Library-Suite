require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const loanRoutes = require('./routes/loans');
const memberRoutes = require('./routes/members');

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/members', memberRoutes);

app.listen(port, () => {
  console.log(`Library backend listening on port ${port}`);
});
