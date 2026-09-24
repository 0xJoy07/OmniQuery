"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import {
    Paperclip,
    ArrowUp,
    FileText,
    Globe,
    CornerDownLeft,
    X
} from "lucide-react";
import { IconBrandYoutube } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";

const SYSTEM_PROMPTS = [
    "Ask a question about a YouTube video...",
    "Query information from a document...",
    "Extract insights from any website...",
];

const TABS = [
    { id: "youtube", label: "YouTube", icon: IconBrandYoutube },
    { id: "document", label: "Document", icon: FileText },
    { id: "website", label: "Website", icon: Globe },
] as const;

type TabType = (typeof TABS)[number]["id"];

interface ChatInputProps {
    onSendMessage: (data: {
        message: string;
        files: { file: File }[];
        pastedContent: unknown[];
        source: string;
        url?: string;
    }) => void;
}

export const AIChatInput = ({ onSendMessage }: ChatInputProps) => {
    const [promptIndex, setPromptIndex] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [value, setValue] = useState("");
    const [activeTab, setActiveTab] = useState<TabType>("youtube");
    const [url, setUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cycle placeholder prompt smoothly
    useEffect(() => {
        if (isExpanded || value) return;
        const interval = setInterval(() => {
            setPromptIndex((prev) => (prev + 1) % SYSTEM_PROMPTS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isExpanded, value]);

    // Handle outside click & Escape key
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                if (!value && !url && !file) setIsExpanded(false);
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isExpanded) {
                setIsExpanded(false);
                inputRef.current?.blur();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [value, isExpanded, url, file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const isUrlValid = () => {
        if (!url.trim()) return true;
        if (activeTab === 'youtube') {
            return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url.trim());
        }
        if (activeTab === 'website') {
            return /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i.test(url.trim()) || /^https?:\/\/localhost(:\d{1,5})?(\/.*)?$/i.test(url.trim());
        }
        return true;
    };

    const validUrl = isUrlValid();

    const isSendDisabled =
        !value.trim() ||
        ((activeTab === 'youtube' || activeTab === 'website') && (!url.trim() || !validUrl)) ||
        (activeTab === 'document' && !file);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (isSendDisabled) return;

        onSendMessage({
            message: value.trim(),
            files: file ? [{ file }] : [],
            pastedContent: [],
            source: activeTab,
            url: url.trim()
        });

        setValue("");
        setUrl("");
        setFile(null);
        setIsExpanded(false);
    };

    return (
        <div className="w-full flex justify-center items-center font-mono">
            <motion.div
                ref={containerRef}
                layout
                transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 32,
                    mass: 0.8,
                }}
                className={`relative w-full max-w-2xl bg-[#0a0a0a] border border-[#333] rounded-2xl transition-shadow duration-300 ${isExpanded
                        ? "shadow-2xl shadow-black/50"
                        : "shadow-xl"
                    }`}
                onClick={() => {
                    setIsExpanded(true);
                    inputRef.current?.focus();
                }}
            >
                <div className="flex flex-col p-2 sm:p-3">
                    {/* Top Bar / Input Field */}
                    <div className="flex items-center gap-2 sm:gap-2.5 w-full">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-xl bg-[#FF6B2C]/10 text-[#FF6B2C] border border-[#FF6B2C]/20 shadow-sm select-none"
                        >
                            {activeTab === 'youtube' && <IconBrandYoutube size={15} />}
                            {activeTab === 'document' && <FileText size={15} />}
                            {activeTab === 'website' && <Globe size={15} />}
                        </motion.div>

                        <form onSubmit={handleSubmit} className="relative flex-1 flex items-center min-w-0">
                            <input
                                ref={inputRef}
                                type="text"
                                value={value || ""}
                                onChange={(e) => setValue(e.target.value)}
                                onFocus={() => setIsExpanded(true)}
                                className="w-full bg-transparent border-none outline-none text-white text-sm py-1.5 z-10 placeholder-transparent"
                            />

                            {!value && (
                                <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none overflow-hidden select-none pr-4 w-full">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={promptIndex}
                                            initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                                            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                            className="text-[#666] text-xs sm:text-sm truncate block w-full"
                                        >
                                            {SYSTEM_PROMPTS[promptIndex]}
                                        </motion.span>
                                    </AnimatePresence>
                                </div>
                            )}
                        </form>

                        <div className="flex-shrink-0 flex items-center gap-1 sm:gap-1.5">
                            <motion.button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubmit();
                                }}
                                disabled={isSendDisabled}
                                whileHover={!isSendDisabled ? { scale: 1.05 } : {}}
                                whileTap={!isSendDisabled ? { scale: 0.95 } : {}}
                                className={`flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-200 ${!isSendDisabled
                                        ? "bg-[#FF6B2C] text-black shadow-md shadow-[#FF6B2C]/20 cursor-pointer"
                                        : "bg-[#111] text-[#444] border border-[#333] cursor-not-allowed"
                                    }`}
                            >
                                {!isSendDisabled ? <ArrowUp size={15} /> : <CornerDownLeft size={13} />}
                            </motion.button>
                        </div>
                    </div>

                    {/* Expanded Sub-Tray */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    opacity: { duration: 0.2 },
                                    height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                                }}
                                className="overflow-hidden w-full"
                            >
                                <div className="border-t border-[#333] pt-3 mt-3 flex flex-col items-start justify-between gap-3 w-full">
                                    
                                    {/* Segmented Control */}
                                    <div className="flex flex-wrap items-center gap-1 bg-[#111] p-1 rounded-xl border border-[#333] w-full sm:w-auto">
                                        {TABS.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = activeTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveTab(tab.id);
                                                    }}
                                                    className={`relative flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-lg text-xs font-medium transition-colors select-none ${isActive
                                                            ? "text-white"
                                                            : "text-[#888] hover:text-[#ccc]"
                                                        }`}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activeTabIndicator"
                                                            className="absolute inset-0 bg-[#FF6B2C]/20 border border-[#FF6B2C]/30 rounded-lg shadow-sm"
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 420,
                                                                damping: 32,
                                                            }}
                                                        />
                                                    )}
                                                    <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
                                                        <Icon size={12} className={isActive ? "text-[#FF6B2C]" : ""} />
                                                        {tab.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Context Input (URL or File) */}
                                    <div className="w-full mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {activeTab === 'document' ? (
                                            <div key="document-input" className="flex items-center gap-3 bg-[#111] rounded-lg p-2 border border-[#333]">
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    accept=".pdf,.txt,.doc,.docx"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        fileInputRef.current?.click();
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#222] hover:bg-[#333] text-[#ccc] rounded-md text-sm transition-colors"
                                                >
                                                    <Paperclip size={14} />
                                                    {file ? 'Change File' : 'Upload File'}
                                                </button>
                                                <span className="text-sm text-[#888] truncate max-w-[200px] sm:max-w-sm">
                                                    {file ? file.name : 'No file selected'}
                                                </span>
                                                {file && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFile(null);
                                                        }}
                                                        className="ml-auto text-[#888] hover:text-[#ccc] p-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div key="url-input">
                                                <input
                                                    type="url"
                                                    value={url || ""}
                                                    onChange={(e) => setUrl(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    placeholder={activeTab === 'youtube' ? "Paste YouTube URL..." : "Paste Website URL..."}
                                                    className={`w-full bg-[#111] text-white placeholder:text-[#666] rounded-lg p-2 text-sm border outline-none transition-colors ${
                                                        url.trim() && !validUrl
                                                            ? "border-red-500/50 focus:border-red-500"
                                                            : "border-[#333] focus:border-[#FF6B2C]/50"
                                                    }`}
                                                />
                                                {url.trim() && !validUrl && (
                                                    <p className="text-red-500 text-xs mt-1.5 ml-1">
                                                        {activeTab === 'youtube'
                                                            ? "Please enter a valid YouTube URL."
                                                            : "Please enter a valid website URL."}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};
