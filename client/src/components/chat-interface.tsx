"use client";
import React, { useState } from 'react';
import ClaudeChatInput from './ui/claude-style-chat-input';

const ChatboxDemo = () => {
    const [messages, setMessages] = useState<string[]>([]);

    const handleSendMessage = (data: {
        message: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        files: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pastedContent: any[];
        source: string;
        url?: string;
    }) => {
        console.log('Sending message:', data.message);
        console.log('Attached files:', data.files);
        console.log('Source selected:', data.source);
        if (data.url) console.log('URL:', data.url);
        
        if (data.message.trim() || data.files.length > 0 || data.pastedContent.length > 0 || data.url) {
            setMessages([...messages, data.message || (data.url ? `URL: ${data.url}` : '')]);
        }
    };

    const currentHour = new Date().getHours();
    let greeting = 'Good morning';
    if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Good afternoon';
    } else if (currentHour >= 18) {
        greeting = 'Good evening';
    }

    return (
        <div className="w-full min-h-screen bg-bg-0 flex flex-col items-center justify-center p-4 font-sans text-text-100 transition-colors duration-200">

            {/* Greeting Section */}
            <div className="w-full max-w-3xl mb-8 sm:mb-12 text-center animate-fade-in">
                <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://cdn.21st.dev/assets/mirror/68/6896117aefeca6a69a2ed98a88c9753acdb1e47b0d54b7b4fa63c7ab59e10f5b.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif font-light text-text-200 mb-3 tracking-tight">
                    {greeting}
                </h1>
            </div>

            <ClaudeChatInput onSendMessage={handleSendMessage} />

        </div>
    );
};

export default ChatboxDemo;
