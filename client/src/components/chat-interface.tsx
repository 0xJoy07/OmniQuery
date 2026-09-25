"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AIChatInput } from './ui/ai-chat-input';
import { ThinkingTool } from './ui/thinking-tool';
import { MarkdownRenderer } from './ui/markdown-renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Settings, User, LogIn, Sparkles, ChevronDown, PanelLeft } from 'lucide-react';
import { Sidebar as AceternitySidebar, SidebarBody } from './ui/sidebar';

// ── Types ────────────────────────────────────────────────────
interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'error';
    content: string;
    followUps: string[];
    source?: string;
    url?: string;
    fileName?: string;
    timestamp: Date;
}

interface Conversation {
    id: string;
    title: string;
    source: string;
    source_url: string | null;
    updated_at: string;
}

// ── Helpers ──────────────────────────────────────────────────

function parseResponse(raw: string): { answer: string; followUps: string[] } {
    const followUps: string[] = [];
    const text = raw.trim();

    // Split based on the explicit marker we added to the prompt
    if (text.includes('###FOLLOW_UP_QUESTIONS###')) {
        const parts = text.split('###FOLLOW_UP_QUESTIONS###');
        
        // Everything before is the answer
        const answerPart = parts[0].trim();
        
        // Everything after is the questions block
        const qLines = parts[1].split('\n');
        for (const line of qLines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Match: "1. question", "1) question", "- question", "* question", "• question"
            const m = trimmed.match(/^(?:\d+[\.\)]\s*|[-*•]\s*)(.+)/);
            if (m) {
                let q = m[1]
                    .replace(/\*\*/g, '')     // strip bold
                    .replace(/^["']|["']$/g, '') // strip quotes
                    .trim();
                if (!q.endsWith('?')) q += '?';
                if (q.length > 5) followUps.push(q);
            }
        }
        
        return { answer: answerPart, followUps };
    }

    // No header found — return as-is
    return { answer: text, followUps: [] };
}

// ── API Call ─────────────────────────────────────────────────
async function queryAPI(payload: {
    source: string;
    question: string;
    url?: string;
    file?: File;
}): Promise<{ answer: string; source: string }> {
    const sourceMap: Record<string, string> = {
        web: 'web',
        website: 'web',
        youtube: 'youtube',
        document: 'document',
    };
    const endpoint = sourceMap[payload.source] || payload.source;

    if (payload.source === 'document' && payload.file) {
        const formData = new FormData();
        formData.append('file', payload.file, payload.file.name);
        formData.append('question', payload.question);

        const res = await fetch(`/api/query/${endpoint}`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    }

    const res = await fetch(`/api/query/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
            url: payload.url,
            question: payload.question,
        }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ── Chat Storage API ─────────────────────────────────────────
const chatAPI = {
    async list(): Promise<Conversation[]> {
        try {
            const res = await fetch('/api/chat/conversations', { credentials: 'include' });
            if (!res.ok) {
                console.error('chatAPI.list failed:', res.status, await res.text());
                return [];
            }
            return await res.json();
        } catch (err) {
            console.error('chatAPI.list error:', err);
            return [];
        }
    },
    async create(source: string, sourceUrl?: string): Promise<Conversation | null> {
        try {
            const res = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ source, source_url: sourceUrl }),
            });
            if (!res.ok) {
                console.error('chatAPI.create failed:', res.status, await res.text());
                return null;
            }
            return await res.json();
        } catch (err) {
            console.error('chatAPI.create error:', err);
            return null;
        }
    },
    async load(id: string) {
        try {
            const res = await fetch(`/api/chat/conversations/${id}`, { credentials: 'include' });
            if (!res.ok) {
                console.error('chatAPI.load failed:', res.status, await res.text());
                return null;
            }
            return await res.json();
        } catch (err) {
            console.error('chatAPI.load error:', err);
            return null;
        }
    },
    async addMessage(convoId: string, msg: { role: string; content: string; follow_ups?: string[]; source?: string; url?: string; file_name?: string }) {
        try {
            const res = await fetch(`/api/chat/conversations/${convoId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(msg),
            });
            if (!res.ok) {
                console.error('chatAPI.addMessage failed:', res.status, await res.text());
            }
        } catch (err) {
            console.error('chatAPI.addMessage error:', err);
        }
    },
};


// ── Component ────────────────────────────────────────────────
const ChatInterface = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const lastContextRef = useRef<{ source: string; url?: string; file?: File }>({ source: 'website' });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Use a ref for activeConvoId to avoid stale closures in useCallback
    const activeConvoIdRef = useRef<string | null>(null);
    activeConvoIdRef.current = activeConvoId;

    // Check auth state via API (httpOnly cookies can't be read by JS)
    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then(res => {
                if (res.ok) {
                    setIsLoggedIn(true);
                    chatAPI.list().then(setConversations);
                }
            })
            .catch(() => {});
    }, []);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Load a conversation
    const loadConversation = useCallback(async (convoId: string) => {
        const data = await chatAPI.load(convoId);
        if (!data) return;

        setActiveConvoId(convoId);
        lastContextRef.current = { source: data.source || 'website', url: data.source_url || undefined };

        const loaded: ChatMessage[] = (data.messages || []).map((m: { role: string; content: string; follow_ups: string[]; source?: string; url?: string; file_name?: string; created_at: string }) => ({
            id: crypto.randomUUID(),
            role: m.role as ChatMessage['role'],
            content: m.content,
            followUps: m.follow_ups || [],
            source: m.source || undefined,
            url: m.url || undefined,
            fileName: m.file_name || undefined,
            timestamp: new Date(m.created_at),
        }));
        setMessages(loaded);
    }, []);

    const handleSendMessage = useCallback(async (data: {
        message: string;
        files: { file: File }[];
        pastedContent: unknown[];
        source: string;
        url?: string;
    }) => {
        const question = data.message.trim();
        if (!question) return;

        lastContextRef.current = {
            source: data.source,
            url: data.url,
            file: data.files?.[0]?.file,
        };

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: question,
            followUps: [],
            source: data.source,
            url: data.url,
            fileName: data.files?.[0]?.file?.name,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        // Create conversation on first message if logged in
        let convoId = activeConvoIdRef.current;
        if (!convoId && isLoggedIn) {
            const convo = await chatAPI.create(data.source, data.url);
            if (convo) {
                convoId = convo.id;
                setActiveConvoId(convo.id);
                activeConvoIdRef.current = convo.id;
                setConversations(prev => [convo, ...prev]);
            }
        }

        // Save user message
        if (convoId && isLoggedIn) {
            await chatAPI.addMessage(convoId, {
                role: 'user',
                content: question,
                source: data.source,
                url: data.url,
                file_name: data.files?.[0]?.file?.name,
            });
            // Refresh sidebar (title may have auto-updated)
            chatAPI.list().then(setConversations);
        }

        try {
            const result = await queryAPI({
                source: data.source,
                question,
                url: data.url,
                file: data.files?.[0]?.file,
            });

            const { answer, followUps } = parseResponse(result.answer);

            const assistantMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: answer,
                followUps,
                source: result.source,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);

            // Save assistant message
            if (convoId && isLoggedIn) {
                await chatAPI.addMessage(convoId, {
                    role: 'assistant',
                    content: answer,
                    follow_ups: followUps,
                    source: result.source,
                });
            }
        } catch (err) {
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'error',
                content: err instanceof Error ? err.message : 'Something went wrong.',
                followUps: [],
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    const handleFollowUp = useCallback((question: string) => {
        const ctx = lastContextRef.current;
        handleSendMessage({
            message: question,
            files: ctx.file ? [{ file: ctx.file }] : [],
            pastedContent: [],
            source: ctx.source,
            url: ctx.url,
        });
    }, [handleSendMessage]);

    const handleNewChat = () => {
        setMessages([]);
        setActiveConvoId(null);
    };

    const currentHour = new Date().getHours();
    let greeting = 'Good morning';
    if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Good afternoon';
    } else if (currentHour >= 18) {
        greeting = 'Good evening';
    }

    const hasMessages = messages.length > 0;

    return (
        <div className="flex h-screen w-full bg-[#0A0A0A] text-zinc-100 font-sans overflow-hidden">
            <AceternitySidebar open={sidebarOpen} setOpen={setSidebarOpen}>
                <SidebarBody className="justify-between gap-4 bg-[#121212] border-r border-zinc-800 !px-0 py-4">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        {/* New Chat Button */}
                        <div className="p-2 shrink-0">
                            <button
                                onClick={handleNewChat}
                                className={`flex items-center ${sidebarOpen ? 'w-full justify-start px-3 py-2' : 'w-10 h-10 justify-center p-0 mx-auto'} gap-3 bg-[#FF6B2C]/10 text-[#FF6B2C] hover:bg-[#FF6B2C]/20 border border-[#FF6B2C]/20 text-sm font-medium rounded-full transition-all whitespace-nowrap`}
                            >
                                <Plus size={16} className="shrink-0" />
                                <motion.span
                                    animate={{ display: sidebarOpen ? "inline-block" : "none", opacity: sidebarOpen ? 1 : 0 }}
                                    className="transition duration-150 inline-block"
                                >
                                    New chat
                                </motion.span>
                            </button>
                        </div>

                        {/* Chat History List */}
                        <div className="flex-1 overflow-y-auto p-2">
                            <motion.div 
                                animate={{ opacity: sidebarOpen ? 1 : 0 }} 
                                className="text-xs font-semibold text-zinc-500 mb-3 px-2 whitespace-nowrap"
                            >
                                {sidebarOpen ? 'Today' : ''}
                            </motion.div>
                            {conversations.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => loadConversation(c.id)}
                                    title={c.title}
                                    className={`flex items-center ${sidebarOpen ? 'w-full justify-start px-3 py-2' : 'w-10 h-10 justify-center p-0 mx-auto'} gap-3 text-sm rounded-full transition-all text-left mb-1 whitespace-nowrap ${
                                        activeConvoId === c.id
                                            ? 'bg-zinc-800 text-white'
                                            : 'hover:bg-zinc-800 text-zinc-300'
                                    }`}
                                >
                                    <MessageSquare size={16} className="shrink-0" />
                                    <motion.span
                                        animate={{ display: sidebarOpen ? "inline-block" : "none", opacity: sidebarOpen ? 1 : 0 }}
                                        className="truncate transition duration-150 inline-block"
                                    >
                                        {c.title}
                                    </motion.span>
                                </button>
                            ))}
                            {conversations.length === 0 && (
                                <button className={`flex items-center ${sidebarOpen ? 'w-full justify-start px-3 py-2' : 'w-10 h-10 justify-center p-0 mx-auto'} gap-3 hover:bg-zinc-800 text-zinc-300 text-sm rounded-full transition-all text-left whitespace-nowrap`}>
                                    <MessageSquare size={16} className="shrink-0" />
                                    <motion.span
                                        animate={{ display: sidebarOpen ? "inline-block" : "none", opacity: sidebarOpen ? 1 : 0 }}
                                        className="truncate transition duration-150 inline-block"
                                    >
                                        Current Conversation
                                    </motion.span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile / Login Section */}
                    <div className="p-2 border-t border-zinc-800 shrink-0">
                        {isLoggedIn ? (
                            <div className={`flex items-center ${sidebarOpen ? 'w-full justify-between' : 'w-10 h-10 mx-auto justify-center'} transition-all`}>
                                <Link 
                                    href="/dashboard/profile" 
                                    className={`flex items-center ${sidebarOpen ? 'flex-1 px-3 py-2 gap-3 justify-start' : 'w-10 h-10 justify-center p-0'} hover:bg-zinc-800 rounded-full transition-all text-sm whitespace-nowrap overflow-hidden`}
                                >
                                    <div className="w-8 h-8 shrink-0 rounded-full bg-zinc-700 flex items-center justify-center">
                                        <User size={16} />
                                    </div>
                                    <motion.div 
                                        animate={{ display: sidebarOpen ? "flex" : "none", opacity: sidebarOpen ? 1 : 0 }}
                                        className="flex-col items-start flex-1 text-left transition duration-150"
                                    >
                                        <span className="font-medium text-zinc-200">Dashboard</span>
                                        <span className="text-xs text-zinc-500">View Profile</span>
                                    </motion.div>
                                </Link>
                                
                                {sidebarOpen && (
                                    <Link 
                                        href="/dashboard/settings" 
                                        className="shrink-0 p-2.5 mr-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 rounded-full transition-all"
                                        title="Settings"
                                    >
                                        <Settings size={16} />
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <Link href="/login" className={`flex items-center ${sidebarOpen ? 'w-full justify-start px-3 py-2' : 'w-10 h-10 justify-center p-0 mx-auto'} gap-3 hover:bg-zinc-800 rounded-full transition-all text-sm whitespace-nowrap overflow-hidden`}>
                                <div className="w-8 h-8 shrink-0 rounded-full bg-[#FF6B2C]/20 flex items-center justify-center">
                                    <LogIn size={16} className="text-[#FF6B2C]" />
                                </div>
                                <motion.div 
                                    animate={{ display: sidebarOpen ? "flex" : "none", opacity: sidebarOpen ? 1 : 0 }}
                                    className="flex-col items-start flex-1 text-left transition duration-150"
                                >
                                    <span className="font-medium text-zinc-200">Login</span>
                                    <span className="text-xs text-zinc-500">Sign in to your account</span>
                                </motion.div>
                            </Link>
                        )}
                    </div>
                </SidebarBody>
            </AceternitySidebar>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col min-w-0 min-h-0 relative bg-[#0A0A0A]">
                {/* Top Header */}
                <header className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-zinc-800/50 bg-[#0A0A0A] sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-lg transition-colors"
                        >
                            <PanelLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-zinc-800/40 cursor-pointer transition-all duration-200">
                            <span className="text-sm font-semibold text-zinc-200 tracking-wide">OmniQuery</span>
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FF6B2C]/10 text-[#FF6B2C] uppercase tracking-wider">Beta</span>
                            
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Mobile New Chat Button */}
                        <button 
                            onClick={handleNewChat} 
                            className="md:hidden p-2 text-zinc-400 hover:text-[#FF6B2C] hover:bg-[#FF6B2C]/10 rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                        
                        {/* Current Model Status */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-xs font-medium text-zinc-400">GPT OSS</span>
                        </div>
                    </div>
                </header>

                {/* Empty state: Greeting + Input centered */}
                {!hasMessages && (
                    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 -mt-14">
                        <div className="w-full mb-8 text-center">
                            <motion.h1 
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                                className="text-3xl font-semibold text-white mb-3"
                            >
                                {greeting}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-zinc-500 text-sm"
                            >
                                Select a mode to start querying data.
                            </motion.p>
                        </div>
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                            className="w-full"
                        >
                            <AIChatInput onSendMessage={handleSendMessage} />
                        </motion.div>
                    </div>
                )}

                {/* Chat state: Messages + Input at bottom */}
                {hasMessages && (
                    <div className="flex-1 flex flex-col h-full min-h-0">
                        {/* Messages area */}
                        <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-4 pb-4 pt-8 space-y-6 scrollbar-thin min-h-0">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {/* User message — unchanged */}
                                    {msg.role === 'user' && (
                                        <div className="max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed bg-zinc-800 text-zinc-100">
                                            {(msg.url || msg.fileName) && (
                                                <div className="text-xs text-[#FF6B2C] mb-2 flex items-center gap-1.5 bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 w-fit px-2 py-1 rounded-md">
                                                    <span className="capitalize font-medium">{msg.source}</span>
                                                    <span className="opacity-50">·</span>
                                                    <span className="truncate max-w-[200px]">{msg.url || msg.fileName}</span>
                                                </div>
                                            )}
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        </div>
                                    )}

                                    {/* Assistant message — markdown + follow-ups */}
                                    {msg.role === 'assistant' && (
                                        <div className="max-w-[90%] w-full">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 shrink-0 w-7 h-7 rounded-lg bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 flex items-center justify-center">
                                                    <Sparkles size={14} className="text-[#FF6B2C]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <MarkdownRenderer content={msg.content} />
                                                </div>
                                            </div>

                                            {/* Follow-up question chips */}
                                            {msg.followUps.length > 0 && (
                                                <div className="mt-4 ml-10 space-y-2">
                                                    <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
                                                        Follow-up questions
                                                    </p>
                                                    <div className="flex flex-col gap-2">
                                                        {msg.followUps.map((q, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleFollowUp(q)}
                                                                disabled={isLoading}
                                                                className="group text-left px-4 py-2.5 rounded-xl text-sm text-zinc-400
                                                                    bg-zinc-900/50 border border-zinc-800 
                                                                    hover:bg-[#FF6B2C]/5 hover:border-[#FF6B2C]/20 hover:text-zinc-200
                                                                    active:scale-[0.98]
                                                                    transition-all duration-200 
                                                                    disabled:opacity-50 disabled:cursor-not-allowed
                                                                    flex items-center gap-2"
                                                            >
                                                                <span className="shrink-0 w-5 h-5 rounded-md bg-zinc-800 group-hover:bg-[#FF6B2C]/10 flex items-center justify-center text-[11px] font-mono text-zinc-500 group-hover:text-[#FF6B2C] transition-colors">
                                                                    {i + 1}
                                                                </span>
                                                                <span className="flex-1">{q}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Error message — unchanged */}
                                    {msg.role === 'error' && (
                                        <div className="max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed bg-red-950/50 border border-red-900/50 text-red-200">
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loading indicator */}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-transparent px-5 py-3 flex items-center min-w-[120px]">
                                        <ThinkingTool state="thinking" />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input pinned to bottom */}
                        <div className="w-full max-w-3xl mx-auto p-4 shrink-0">
                            <AIChatInput onSendMessage={handleSendMessage} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ChatInterface;
