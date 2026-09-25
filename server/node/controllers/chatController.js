const supabase = require('../config/db');

// ── CREATE a new conversation ────────────────────────────────
const createConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, source, source_url } = req.body;

        const { data, error } = await supabase
            .from('conversations')
            .insert({
                user_id: userId,
                title: title || 'New Chat',
                source: source || 'website',
                source_url: source_url || null,
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        console.error('Create conversation error:', err.message);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
};

// ── LIST all conversations for the current user ──────────────
const getConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('conversations')
            .select('id, title, source, source_url, created_at, updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        console.error('Get conversations error:', err.message);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
};

// ── GET a single conversation with its messages ──────────────
const getConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Verify ownership
        const { data: convo, error: convoErr } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (convoErr || !convo) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Fetch messages
        const { data: messages, error: msgErr } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', id)
            .order('created_at', { ascending: true });

        if (msgErr) throw msgErr;

        res.json({ ...convo, messages: messages || [] });
    } catch (err) {
        console.error('Get conversation error:', err.message);
        res.status(500).json({ error: 'Failed to fetch conversation' });
    }
};

// ── UPDATE conversation title ────────────────────────────────
const updateConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title } = req.body;

        const { data, error } = await supabase
            .from('conversations')
            .update({ title, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Conversation not found' });

        res.json(data);
    } catch (err) {
        console.error('Update conversation error:', err.message);
        res.status(500).json({ error: 'Failed to update conversation' });
    }
};

// ── DELETE a conversation (cascades to messages) ─────────────
const deleteConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('conversations')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;
        res.json({ message: 'Conversation deleted' });
    } catch (err) {
        console.error('Delete conversation error:', err.message);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
};

// ── ADD a message to a conversation ──────────────────────────
const addMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;  // conversation id
        const { role, content, follow_ups, source, url, file_name } = req.body;

        // Verify ownership
        const { data: convo, error: convoErr } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (convoErr || !convo) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        // Insert message
        const { data: message, error: msgErr } = await supabase
            .from('messages')
            .insert({
                conversation_id: id,
                role,
                content,
                follow_ups: follow_ups || [],
                source: source || null,
                url: url || null,
                file_name: file_name || null,
            })
            .select()
            .single();

        if (msgErr) throw msgErr;

        // Update conversation's updated_at + auto-title from first user message
        const updates = { updated_at: new Date().toISOString() };

        // Auto-title: use the first user message (truncated) as the title
        if (role === 'user') {
            const { data: existingMsgs } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', id)
                .eq('role', 'user')
                .limit(2);

            // If this is the first user message, auto-set title
            if (existingMsgs && existingMsgs.length <= 1) {
                updates.title = content.length > 60
                    ? content.substring(0, 60) + '...'
                    : content;
            }
        }

        await supabase
            .from('conversations')
            .update(updates)
            .eq('id', id);

        res.status(201).json(message);
    } catch (err) {
        console.error('Add message error:', err.message);
        res.status(500).json({ error: 'Failed to add message' });
    }
};

module.exports = {
    createConversation,
    getConversations,
    getConversation,
    updateConversation,
    deleteConversation,
    addMessage,
};
