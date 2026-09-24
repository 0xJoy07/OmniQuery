const jwt = require('jsonwebtoken');
const supabase = require('../config/db');

const protect = async (req, res, next) => {
    const token = req.cookies.session_token;

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        // Check if token is blacklisted in Supabase
        const { data: blacklisted } = await supabase
            .from('blacklisted_tokens')
            .select('id')
            .eq('token', token)
            .single();

        if (blacklisted) {
            return res.status(401).json({ error: 'Not authorized, token revoked' });
        }

        // Verify the JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'default_secret');
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
