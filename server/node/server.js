require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const queryRoutes = require('./routes/query');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5001;

// ── Middleware ──────────────────────────────────────────────
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Parse JSON for auth routes — but NOT for document uploads (multipart)
// The document route needs the raw stream to forward to Flask
app.use('/api/auth', express.json());
app.use('/api/query/web', express.json());
app.use('/api/query/youtube', express.json());
app.use('/api/query/document', express.json()); // Parses JSON for follow-ups, ignores multipart
app.use('/api/chat', express.json());

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/chat', chatRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'express' });
});

// ── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Express backend running on http://localhost:${PORT}`);
    console.log(`Flask backend expected at ${process.env.FLASK_BASE_URL || 'http://localhost:8000'}`);
});
