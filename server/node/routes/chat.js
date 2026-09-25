const express = require('express');
const router = express.Router();
const {
    createConversation,
    getConversations,
    getConversation,
    updateConversation,
    deleteConversation,
    addMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes require authentication
router.use(protect);

// Conversations CRUD
router.post('/conversations', createConversation);           // Create
router.get('/conversations', getConversations);              // List all
router.get('/conversations/:id', getConversation);           // Get one + messages
router.patch('/conversations/:id', updateConversation);      // Update title
router.delete('/conversations/:id', deleteConversation);     // Delete

// Messages
router.post('/conversations/:id/messages', addMessage);      // Add message

module.exports = router;
