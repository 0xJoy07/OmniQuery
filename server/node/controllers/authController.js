const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const supabase = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'default_secret';

const setTokenCookie = (res, token) => {
    res.cookie('session_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }

        // Check if user already exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user into Supabase
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: 'user'
            })
            .select('id, name, email, role')
            .single();

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            return res.status(500).json({ error: 'Failed to create user' });
        }

        const payload = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        setTokenCookie(res, token);
        res.status(201).json({ success: true, user: payload });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Fetch user from Supabase
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, name, email, password, role')
            .eq('email', email.toLowerCase().trim())
            .single();

        if (fetchError || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        setTokenCookie(res, token);
        res.json({ success: true, user: payload });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// @desc    Logout user / clear cookie and blacklist token
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
    try {
        const token = req.cookies.session_token;

        if (token) {
            // Decode to get expiry for cleanup scheduling
            let expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            try {
                const decoded = jwt.decode(token);
                if (decoded && decoded.exp) {
                    expiresAt = new Date(decoded.exp * 1000).toISOString();
                }
            } catch (_) { /* use default expiry */ }

            // Insert token into blacklist table
            await supabase
                .from('blacklisted_tokens')
                .insert({ token, expires_at: expiresAt });
        }

        res.clearCookie('session_token', { path: '/' });
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ error: 'Server error during logout' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Profile Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile
};
