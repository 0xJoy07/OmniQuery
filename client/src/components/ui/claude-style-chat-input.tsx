import React, { useState, useRef } from 'react';
import { FileText, Globe, Send, Paperclip, X } from 'lucide-react';
import { IconBrandYoutube } from '@tabler/icons-react';

interface ChatInputProps {
    onSendMessage: (data: {
        message: string;
        files: { file: File }[];
        pastedContent: unknown[];
        source: string;
        url?: string;
    }) => void;
}

export default function ClaudeChatInput({ onSendMessage }: ChatInputProps) {
    const [source, setSource] = useState<'youtube' | 'document' | 'website' | null>(null);
    const [message, setMessage] = useState('');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (!source || !message.trim()) return;

        if ((source === 'youtube' || source === 'website') && !url.trim()) return;
        if (source === 'document' && !file) return;

        onSendMessage({
            message: message.trim(),
            files: file ? [{ file }] : [],
            pastedContent: [],
            source,
            url: url.trim()
        });

        setMessage('');
        setUrl('');
        setFile(null);
        // Do not reset source to allow continuous chat in the same mode
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const isSendDisabled =
        !source ||
        !message.trim() ||
        ((source === 'youtube' || source === 'website') && !url.trim()) ||
        (source === 'document' && !file);

    return (
        <div className="w-full bg-[#1A1A1A] rounded-2xl border border-zinc-800 p-4 shadow-sm flex flex-col gap-3">
            {/* Mode Selector */}
            <div className="flex gap-2 mb-1 overflow-x-auto pb-1">
                <button
                    onClick={() => setSource('youtube')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        source === 'youtube'
                            ? 'bg-[#FF6B2C]/10 text-[#FF6B2C] border-[#FF6B2C]/30'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                >
                    <IconBrandYoutube size={16} />
                    YouTube
                </button>
                <button
                    onClick={() => setSource('document')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        source === 'document'
                            ? 'bg-[#FF6B2C]/10 text-[#FF6B2C] border-[#FF6B2C]/30'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                >
                    <FileText size={16} />
                    Document
                </button>
                <button
                    onClick={() => setSource('website')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        source === 'website'
                            ? 'bg-[#FF6B2C]/10 text-[#FF6B2C] border-[#FF6B2C]/30'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-transparent'
                    }`}
                >
                    <Globe size={16} />
                    Website
                </button>
            </div>

            {/* Context Input (URL or File) */}
            {source && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    {source === 'document' ? (
                        <div className="flex items-center gap-3 bg-zinc-900 rounded-lg p-2 border border-zinc-800">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept=".pdf,.txt,.doc,.docx"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-sm transition-colors"
                            >
                                <Paperclip size={16} />
                                {file ? 'Change File' : 'Upload File'}
                            </button>
                            <span className="text-sm text-zinc-400 truncate max-w-[200px] sm:max-w-sm">
                                {file ? file.name : 'No file selected'}
                            </span>
                            {file && (
                                <button
                                    onClick={() => setFile(null)}
                                    className="ml-auto text-zinc-400 hover:text-zinc-200 p-1"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    ) : (
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={source === 'youtube' ? "Paste YouTube URL..." : "Paste Website URL..."}
                            className="w-full bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 rounded-lg p-3 text-sm border border-zinc-800 outline-none focus:border-[#FF6B2C]/50 transition-colors"
                        />
                    )}
                </div>
            )}

            {/* Message Input Area */}
            <div className="relative flex items-end gap-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        !source
                            ? "Select a mode above to start..."
                            : "Ask a question..."
                    }
                    disabled={!source}
                    className="w-full bg-transparent text-zinc-100 placeholder:text-zinc-500 resize-none outline-none py-2 px-1 max-h-32 min-h-[44px] scrollbar-thin disabled:opacity-50"
                    rows={1}
                    style={{
                        height: message ? 'auto' : '44px',
                    }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = '44px';
                        target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                    }}
                />
                
                <button
                    onClick={handleSend}
                    disabled={isSendDisabled}
                    className={`p-2 rounded-xl flex-shrink-0 transition-all ${
                        isSendDisabled
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            : 'bg-[#FF6B2C] text-black hover:bg-[#FF6B2C]/90 active:scale-95'
                    }`}
                >
                    <Send size={18} className={isSendDisabled ? '' : 'ml-0.5'} />
                </button>
            </div>
        </div>
    );
}
