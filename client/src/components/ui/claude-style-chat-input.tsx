import React, { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, X, FileText, Loader2, Check, Archive, MonitorPlay, Globe } from "lucide-react";

/* --- ICONS --- */
export const Icons = {
    ArrowUp: ArrowUp,
    X: X,
    FileText: FileText,
    Loader2: Loader2,
    Check: Check,
    Archive: Archive,
    Youtube: MonitorPlay,
    Globe: Globe,
};

/* --- UTILS --- */
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/* --- COMPONENTS --- */

// 1. File Preview Card
interface AttachedFile {
    id: string;
    file: File;
    type: string;
    preview: string | null;
    uploadStatus: string;
    content?: string;
}

interface FilePreviewCardProps {
    file: AttachedFile;
    onRemove: (id: string) => void;
}

const FilePreviewCard: React.FC<FilePreviewCardProps> = ({ file, onRemove }) => {
    const isImage = file.type.startsWith("image/") && file.preview;

    return (
        <div className={`relative group flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-bg-300 bg-bg-200 animate-fade-in transition-all hover:border-text-400`}>
            {isImage ? (
                <div className="w-full h-full relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={file.preview!} alt={file.file.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                </div>
            ) : (
                <div className="w-full h-full p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-bg-300 rounded">
                            <Icons.FileText className="w-4 h-4 text-text-300" />
                        </div>
                        <span className="text-[10px] font-medium text-text-400 uppercase tracking-wider truncate">
                            {file.file.name.split('.').pop()}
                        </span>
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-xs font-medium text-text-200 truncate" title={file.file.name}>
                            {file.file.name}
                        </p>
                        <p className="text-[10px] text-text-500">
                            {formatFileSize(file.file.size)}
                        </p>
                    </div>
                </div>
            )}

            <button
                onClick={() => onRemove(file.id)}
                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <Icons.X className="w-3 h-3" />
            </button>

            {file.uploadStatus === 'uploading' && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Icons.Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
            )}
        </div>
    );
};

// 2. Pasted Content Card
export interface PastedContent {
    id: string;
    content: string;
    timestamp: Date;
}

interface PastedContentCardProps {
    content: PastedContent;
    onRemove: (id: string) => void;
}

const PastedContentCard: React.FC<PastedContentCardProps> = ({ content, onRemove }) => {
    return (
        <div className="relative group flex-shrink-0 w-28 h-28 rounded-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#30302E] bg-white dark:bg-[#20201F] animate-fade-in p-3 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <div className="overflow-hidden w-full">
                <p className="text-[10px] text-[#9CA3AF] leading-[1.4] font-mono break-words whitespace-pre-wrap line-clamp-4 select-none">
                    {content.content}
                </p>
            </div>

            <div className="flex items-center justify-between w-full mt-2">
                <div className="inline-flex items-center justify-center px-1.5 py-[2px] rounded border border-[#E5E5E5] dark:border-[#404040] bg-white dark:bg-transparent">
                    <span className="text-[9px] font-bold text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider font-sans">PASTED</span>
                </div>
            </div>

            <button
                onClick={() => onRemove(content.id)}
                className="absolute top-2 right-2 p-[3px] bg-white dark:bg-[#30302E] border border-[#E5E5E5] dark:border-[#404040] rounded-full text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
            >
                <Icons.X className="w-2 h-2" />
            </button>
        </div>
    );
};


// 3. Main Chat Input Component
interface ClaudeChatInputProps {
    onSendMessage: (data: {
        message: string;
        files: AttachedFile[];
        pastedContent: PastedContent[];
        source: string;
        url?: string;
    }) => void;
}

export const ClaudeChatInput: React.FC<ClaudeChatInputProps> = ({ onSendMessage }) => {
    const [message, setMessage] = useState("");
    const [urlInput, setUrlInput] = useState("");
    const [files, setFiles] = useState<AttachedFile[]>([]);
    const [pastedContent, setPastedContent] = useState<PastedContent[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedSource, setSelectedSource] = useState<"document" | "youtube" | "website">("document");

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 384) + "px";
        }
    }, [message]);

    // File Handling
    const handleFiles = useCallback((newFilesList: FileList | File[]) => {
        const newFiles = Array.from(newFilesList).map(file => {
            const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
            return {
                id: Math.random().toString(36).substr(2, 9),
                file,
                type: isImage ? 'image/unknown' : (file.type || 'application/octet-stream'),
                preview: isImage ? URL.createObjectURL(file) : null,
                uploadStatus: 'pending'
            };
        });

        setFiles(prev => [...prev, ...newFiles]);

        newFiles.forEach(f => {
            setTimeout(() => {
                setFiles(prev => prev.map(p => p.id === f.id ? { ...p, uploadStatus: 'complete' } : p));
            }, 800 + Math.random() * 1000);
        });
    }, []);

    // Drag & Drop
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (selectedSource === 'document' && e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // Paste Handling
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const pastedFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                const file = items[i].getAsFile();
                if (file) pastedFiles.push(file);
            }
        }

        if (pastedFiles.length > 0 && selectedSource === 'document') {
            e.preventDefault();
            handleFiles(pastedFiles);
            return;
        }

        const text = e.clipboardData.getData('text');
        if (text.length > 300) {
            e.preventDefault();
            const snippet = {
                id: Math.random().toString(36).substr(2, 9),
                content: text,
                timestamp: new Date()
            };
            setPastedContent(prev => [...prev, snippet]);
        }
    };

    const handleSend = () => {
        const hasContent = message.trim() || files.length > 0 || pastedContent.length > 0 || urlInput.trim();
        if (!hasContent) return;
        
        onSendMessage({ 
            message, 
            files, 
            pastedContent, 
            source: selectedSource,
            url: urlInput.trim() ? urlInput.trim() : undefined
        });
        
        setMessage("");
        setUrlInput("");
        setFiles([]);
        setPastedContent([]);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasContent = message.trim() || files.length > 0 || pastedContent.length > 0 || urlInput.trim();

    return (
        <div
            className={`relative w-full max-w-2xl mx-auto transition-all duration-300 font-mono`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div className={`
                !box-content flex flex-col mx-2 md:mx-0 items-stretch transition-all duration-300 relative z-10 rounded-xl cursor-text 
                border border-transparent bg-origin-border
                shadow-[inset_0_1px_0_rgba(255,107,44,0.15),_0_0_40px_rgba(255,107,44,0.06)]
                font-mono antialiased
            `}
            style={{
                background: 'linear-gradient(to bottom right, #2a1208, #1a0d05, #0f0a08) padding-box, linear-gradient(to bottom right, rgba(255,107,44,0.6), rgba(255,107,44,0.1), transparent) border-box'
            }}>

                <div className="flex flex-col px-3 pt-3 pb-2 gap-2">

                    {/* Tabs for Sources */}
                    <div className="flex items-center gap-2 mb-2 px-1 pb-2 border-b-2 border-transparent" style={{ borderImage: 'linear-gradient(to right, rgba(255,107,44,0.2), transparent) 1' }}>
                        {['document', 'website', 'youtube'].map((source) => (
                            <button
                                key={source}
                                onClick={() => setSelectedSource(source as any)}
                                className={`relative flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${selectedSource === source ? 'text-[#FF6B2C]' : 'text-white/40 hover:text-white/60'}`}
                            >
                                {source === 'document' && <Icons.FileText className="w-4 h-4" />}
                                {source === 'website' && <Icons.Globe className="w-4 h-4" />}
                                {source === 'youtube' && <Icons.Youtube className="w-4 h-4" />}
                                <span className="capitalize">{source}</span>
                                
                                {/* Animated active underline */}
                                {selectedSource === source && (
                                    <span className="absolute bottom-[-11px] left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B2C] to-[#FF9D70] animate-[scaleX_200ms_ease-out] origin-left" style={{ animationName: 'scaleX', animationDuration: '200ms', animationFillMode: 'forwards' }} />
                                )}
                            </button>
                        ))}
                    </div>
                    <style>{`
                        @keyframes scaleX {
                            from { transform: scaleX(0); }
                            to { transform: scaleX(1); }
                        }
                        @keyframes bounce-twice {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-4px); }
                        }
                        @keyframes fade-in-delayed {
                            0% { opacity: 0; }
                            100% { opacity: 1; }
                        }
                        .animate-bounce-twice { animation: bounce-twice 400ms ease-in-out 2; }
                    `}</style>

                    {/* Dynamic Source Input Zones */}
                    <div className="px-1 mb-2">
                        {selectedSource === 'document' && (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full border-2 border-dashed transition-all duration-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer text-white/40 group overflow-hidden relative bg-gradient-to-br from-[#FF6B2C]/5 to-transparent hover:from-[#FF6B2C]/10 hover:to-transparent hover:scale-[1.005]
                                    ${isDragging ? 'border-[#FF6B2C] border-solid bg-[#FF6B2C]/10' : 'border-[#FF6B2C]/40'}`}
                            >
                                <Icons.Archive className="w-6 h-6 mb-2 group-hover:text-[#FF6B2C] transition-colors duration-300 group-hover:animate-bounce-twice relative z-10" />
                                <span className="text-sm font-medium group-hover:text-white transition-colors duration-300 relative z-10">Click to browse or drag and drop</span>
                                <span className="text-xs mt-1 opacity-70 relative z-10">Supports PDF, Markdown, Images...</span>
                            </div>
                        )}
                        {selectedSource === 'website' && (
                            <div className="w-full bg-transparent rounded-md px-3 py-2 flex items-center gap-2 border border-[#FF6B2C]/30 focus-within:border-[#FF6B2C] transition-colors">
                                <Icons.Globe className="w-4 h-4 text-neutral-400" />
                                <input 
                                    type="url"
                                    placeholder="Paste website URL here..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-neutral-500"
                                />
                            </div>
                        )}
                        {selectedSource === 'youtube' && (
                            <div className="w-full bg-transparent rounded-md px-3 py-2 flex items-center gap-2 border border-[#FF6B2C]/30 focus-within:border-[#FF6B2C] transition-colors">
                                <Icons.Youtube className="w-4 h-4 text-neutral-400" />
                                <input 
                                    type="url"
                                    placeholder="Paste YouTube URL here..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="bg-transparent border-none outline-none w-full text-sm text-white placeholder:text-neutral-500"
                                />
                            </div>
                        )}
                    </div>

                    {/* Artifacts Display (Files & Pastes) */}
                    {(files.length > 0 || pastedContent.length > 0) && selectedSource === 'document' && (
                        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-1">
                            {pastedContent.map(content => (
                                <PastedContentCard
                                    key={content.id}
                                    content={content}
                                    onRemove={id => setPastedContent(prev => prev.filter(c => c.id !== id))}
                                />
                            ))}
                            {files.map(file => (
                                <FilePreviewCard
                                    key={file.id}
                                    file={file}
                                    onRemove={id => setFiles(prev => prev.filter(f => f.id !== id))}
                                />
                            ))}
                        </div>
                    )}

                    {/* Main Text Input Area */}
                    <div className="relative mb-1 group/input">
                        <div className="max-h-96 w-full overflow-y-auto custom-scrollbar font-mono break-words transition-all duration-200 min-h-[2.5rem] pl-1 rounded-sm focus-within:bg-gradient-to-t focus-within:from-[#FF6B2C]/5 focus-within:to-transparent">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onPaste={handlePaste}
                                onKeyDown={handleKeyDown}
                                placeholder="How can I help you today?"
                                className="w-full bg-transparent border-0 outline-none text-white text-[14px] placeholder:text-transparent focus:placeholder:text-white/25 resize-none overflow-hidden py-0 leading-relaxed block font-normal antialiased transition-all"
                                rows={1}
                                autoFocus
                                style={{ 
                                    minHeight: '1.5em',
                                    animation: 'fade-in-delayed 400ms ease-out 400ms forwards'
                                }}
                            />
                            {/* Static placeholder before focus */}
                            {!message && (
                                <span className="absolute top-0 left-1 text-white/25 text-[14px] pointer-events-none opacity-0" style={{ animation: 'fade-in-delayed 400ms ease-out 400ms forwards' }}>
                                    How can I help you today?
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex gap-2 w-full justify-end items-center mt-2">
                        <button
                            onClick={handleSend}
                            disabled={!hasContent}
                            className={`
                                group/btn inline-flex items-center justify-center relative shrink-0 transition-all duration-200 rounded-md !h-8 !w-8 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                                ${hasContent
                                    ? 'bg-[#FF6B2C]/20 border border-[#FF6B2C]/30 text-[#FF6B2C] hover:bg-[#FF6B2C] hover:text-black hover:scale-105 hover:shadow-[0_0_20px_rgba(255,107,44,0.5)] active:scale-95'
                                    : 'bg-white/5 text-white/20'}
                            `}
                            type="button"
                            aria-label="Send message"
                        >
                            <Icons.ArrowUp className="w-4 h-4 transition-transform duration-150 group-hover/btn:-translate-y-0.5" />
                        </button>
                    </div>
                </div>
            </div>

            {
                isDragging && selectedSource === 'document' && (
                    <div className="absolute inset-0 bg-bg-200/90 border-2 border-dashed border-accent rounded-2xl z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
                        <Icons.Archive className="w-10 h-10 text-accent mb-2 animate-bounce" />
                        <p className="text-accent font-medium">Drop files to upload</p>
                    </div>
                )
            }

            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                    e.target.value = '';
                }}
                className="hidden"
            />
        </div>
    );
};

export default ClaudeChatInput;
