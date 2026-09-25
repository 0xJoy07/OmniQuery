const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const FLASK_BASE_URL = process.env.FLASK_BASE_URL || 'http://localhost:8000';

// @desc    Query a website
// @route   POST /api/query/web
// @access  Private
router.post('/web', protect, async (req, res) => {
    try {
        const { url, question, history } = req.body;

        if (!url || !question) {
            return res.status(400).json({ error: 'URL and question are required' });
        }

        const response = await fetch(`${FLASK_BASE_URL}/api/query/web`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, question, history }),
            signal: AbortSignal.timeout(60000),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error || data.detail || 'Flask backend error' });
        }

        res.json(data);
    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return res.status(504).json({ error: 'Request to Flask backend timed out' });
        }
        console.error('Web query error:', error);
        res.status(500).json({ error: 'Server error while processing web query' });
    }
});

// @desc    Query a YouTube video
// @route   POST /api/query/youtube
// @access  Private
router.post('/youtube', protect, async (req, res) => {
    try {
        const { url, question, history } = req.body;

        if (!url || !question) {
            return res.status(400).json({ error: 'YouTube URL and question are required' });
        }

        const response = await fetch(`${FLASK_BASE_URL}/api/query/youtube`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, question, history }),
            signal: AbortSignal.timeout(60000),
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error || data.detail || 'Flask backend error' });
        }

        res.json(data);
    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return res.status(504).json({ error: 'Request to Flask backend timed out' });
        }
        console.error('YouTube query error:', error);
        res.status(500).json({ error: 'Server error while processing YouTube query' });
    }
});

// @desc    Query a document (file upload)
// @route   POST /api/query/document
// @access  Private
router.post('/document', protect, async (req, res) => {
    try {
        const contentType = req.headers['content-type'] || '';

        // For multipart/form-data, we need to forward the raw request to Flask
        // Since Express already parsed JSON, we use a different approach for files
        if (contentType.includes('multipart/form-data')) {
            // Forward the raw body to Flask
            // We need the raw body — use a piped approach
            const { Readable } = require('stream');

            const response = await fetch(`${FLASK_BASE_URL}/api/query/document`, {
                method: 'POST',
                headers: {
                    'content-type': contentType,
                },
                body: Readable.toWeb(req),
                duplex: 'half',
                signal: AbortSignal.timeout(120000),
            });

            const data = await response.json();

            if (!response.ok) {
                return res.status(response.status).json({ error: data.error || data.detail || 'Flask backend error' });
            }

            return res.json(data);
        }

        // If it's a JSON request (follow up without file)
        const { question, history } = req.body;
        if (question) {
            const response = await fetch(`${FLASK_BASE_URL}/api/query/document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, history }),
                signal: AbortSignal.timeout(60000),
            });
            const data = await response.json();
            if (!response.ok) return res.status(response.status).json({ error: data.error || data.detail || 'Flask backend error' });
            return res.json(data);
        }

        return res.status(400).json({ error: 'Document endpoint requires multipart/form-data or JSON with question' });
    } catch (error) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return res.status(504).json({ error: 'Request to Flask backend timed out' });
        }
        console.error('Document query error:', error);
        res.status(500).json({ error: 'Server error while processing document query' });
    }
});

// @desc    Health check — also checks Flask backend
// @route   GET /api/query/health
// @access  Public
router.get('/health', async (req, res) => {
    try {
        const response = await fetch(`${FLASK_BASE_URL}/api/health`, {
            signal: AbortSignal.timeout(5000),
        });
        const data = await response.json();
        res.json({ node: 'ok', flask: data.status || 'ok' });
    } catch {
        res.json({ node: 'ok', flask: 'unreachable' });
    }
});

module.exports = router;
