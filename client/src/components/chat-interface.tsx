"use client";
import React, { useState, useRef, useEffect } from 'react';
import ClaudeChatInput from './ui/claude-style-chat-input';
import { ThinkingTool } from './ui/thinking-tool';
import { motion } from 'framer-motion';
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
    // Document upload uses FormData
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

    // URL-based queries use JSON
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        files: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pastedContent: any[];
        source: string;
        url?: string;
    }) => {
        const question = data.message.trim();
        if (!question) return;

        // Build user message
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

    const currentHour = new Date().getHours();
    let greeting = 'Good morning';
    if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Good afternoon';
    } else if (currentHour >= 18) {
        greeting = 'Good evening';
    }

    const hasMessages = messages.length > 0;

    return (
        <div className="relative w-full min-h-screen flex flex-col items-center p-4 font-mono text-white transition-colors duration-200 bg-[radial-gradient(ellipse_at_top,_#0f0a08_0%,_#000000_100%)]">
            {/* Subtle orange glow at center top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF6B2C]/[0.03] rounded-full blur-[100px] pointer-events-none" />

            {/* ── Empty state: Greeting + Input centered ── */}
            {!hasMessages && (
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl relative z-10">
                    <div className="w-full mb-8 sm:mb-12 text-center">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                            className="w-24 h-24 mx-auto mb-6 flex items-center justify-center"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src="https://cdn.21st.dev/assets/mirror/68/6896117aefeca6a69a2ed98a88c9753acdb1e47b0d54b7b4fa63c7ab59e10f5b.png" 
                                alt="Logo" 
                                className="w-full h-full object-contain animate-[spin_8s_linear_infinite] hover:animate-[spin_2s_linear_infinite] drop-shadow-[0_0_10px_rgba(255,107,44,0.3)] hover:drop-shadow-[0_0_25px_rgba(255,107,44,0.7)] transition-all duration-300 cursor-pointer" 
                            />
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            className="text-3xl sm:text-4xl font-mono font-bold text-white mb-3 tracking-tight"
                        >
                            {greeting}
                        </motion.h1>
                    </div>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="w-full"
                    >
                        <ClaudeChatInput onSendMessage={handleSendMessage} />
                    </motion.div>
                </div>
            )}

            {/* ── Chat state: Messages + Input at bottom ── */}
            {hasMessages && (
                <>
                    {/* Messages area */}
                    <div className="flex-1 w-full max-w-3xl overflow-y-auto pb-4 space-y-4 pt-6">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`
                                    max-w-[85%] rounded-md px-4 py-3 text-sm leading-relaxed
                                    ${msg.role === 'user'
                                        ? 'bg-[#FF6B2C] text-black font-semibold'
                                        : msg.role === 'error'
                                            ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                                            : 'bg-transparent border border-[#FF6B2C]/30 text-white'
                                    }
                                `}>
                                    {/* Source badge for user messages */}
                                    {msg.role === 'user' && (msg.url || msg.fileName) && (
                                        <div className="text-xs opacity-70 mb-1.5 flex items-center gap-1.5">
                                            <span className="uppercase font-medium tracking-wider">{msg.source}</span>
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
                                <div className="bg-transparent border border-[#FF6B2C]/30 rounded-md px-4 py-3 flex items-center min-w-[120px]">
                                    <ThinkingTool state="thinking" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input pinned to bottom */}
                    <div className="w-full max-w-3xl pt-2 pb-2 shrink-0">
                        <ClaudeChatInput onSendMessage={handleSendMessage} />
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatInterface;
