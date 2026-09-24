"use client";
import React, { useState, useRef, useEffect } from 'react';
import { AIChatInput } from './ui/ai-chat-input';
import { ThinkingTool } from './ui/thinking-tool';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Settings, User } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────
interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'error';
    content: string;
    source?: string;
    url?: string;
    fileName?: string;
    timestamp: Date;
}

// ── API Call ─────────────────────────────────────────────────
async function queryAPI(payload: {
    source: string;
    question: string;
    url?: string;
    file?: File;
}): Promise<{ answer: string; source: string }> {
    if (payload.source === 'document' && payload.file) {
        const formData = new FormData();
        formData.append('file', payload.file, payload.file.name);
        formData.append('question', payload.question);

        const res = await fetch('/api/query', {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    }

    const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            source: payload.source,
            question: payload.question,
            url: payload.url,
        }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ── Component ────────────────────────────────────────────────
const ChatInterface = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSendMessage = async (data: {
        message: string;
        files: { file: File }[];
        pastedContent: unknown[];
        source: string;
        url?: string;
    }) => {
        const question = data.message.trim();
        if (!question) return;

        const userMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: question,
            source: data.source,
            url: data.url,
            fileName: data.files?.[0]?.file?.name,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const result = await queryAPI({
                source: data.source,
                question,
                url: data.url,
                file: data.files?.[0]?.file,
            });

            const assistantMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.answer,
                source: result.source,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMsg]);
        } catch (err) {
            const errorMsg: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'error',
                content: err instanceof Error ? err.message : 'Something went wrong.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setMessages([]);
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
        <div className="flex h-screen w-full bg-[#0A0A0A] text-zinc-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-[#121212] border-r border-zinc-800 flex flex-col flex-shrink-0 hidden md:flex">
                {/* New Chat Button */}
                <div className="p-3">
                    <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-3 py-2 bg-[#FF6B2C]/10 text-[#FF6B2C] hover:bg-[#FF6B2C]/20 border border-[#FF6B2C]/20 text-sm font-medium rounded-lg transition-colors"
                    >
                        <Plus size={16} />
                        New chat
                    </button>
                </div>

                {/* Chat History List */}
                <div className="flex-1 overflow-y-auto p-3">
                    <div className="text-xs font-semibold text-zinc-500 mb-3 px-2">Today</div>
                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 text-zinc-300 text-sm rounded-lg transition-colors truncate text-left">
                        <MessageSquare size={16} className="shrink-0" />
                        <span className="truncate">Current Conversation</span>
                    </button>
                </div>

                {/* Profile Section */}
                <div className="p-3 border-t border-zinc-800">
                    <button className="w-full flex items-center gap-3 px-3 py-2 hover:bg-zinc-800 rounded-lg transition-colors text-sm">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                            <User size={16} />
                        </div>
                        <div className="flex flex-col items-start flex-1 text-left">
                            <span className="font-medium text-zinc-200">User Profile</span>
                            <span className="text-xs text-zinc-500">Free Plan</span>
                        </div>
                        <Settings size={16} className="text-zinc-500" />
                    </button>
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Empty state: Greeting + Input centered */}
                {!hasMessages && (
                    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4">
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
                    <div className="flex-1 flex flex-col h-full">
                        {/* Messages area */}
                        <div className="flex-1 w-full max-w-3xl mx-auto overflow-y-auto px-4 pb-4 pt-8 space-y-6 scrollbar-thin">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`
                                        max-w-[85%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed
                                        ${msg.role === 'user'
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : msg.role === 'error'
                                                ? 'bg-red-950/50 border border-red-900/50 text-red-200'
                                                : 'bg-transparent text-zinc-200'
                                        }
                                    `}>
                                        {/* Source badge for user messages */}
                                        {msg.role === 'user' && (msg.url || msg.fileName) && (
                                            <div className="text-xs text-[#FF6B2C] mb-2 flex items-center gap-1.5 bg-[#FF6B2C]/10 border border-[#FF6B2C]/20 w-fit px-2 py-1 rounded-md">
                                                <span className="capitalize font-medium">{msg.source}</span>
                                                <span className="opacity-50">·</span>
                                                <span className="truncate max-w-[200px]">{msg.url || msg.fileName}</span>
                                            </div>
                                        )}
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>
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
