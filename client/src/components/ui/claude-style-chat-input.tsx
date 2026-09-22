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
            className={`relative w-full max-w-2xl mx-auto transition-all duration-300 font-sans`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div className={`
                !box-content flex flex-col mx-2 md:mx-0 items-stretch transition-all duration-200 relative z-10 rounded-2xl cursor-text border border-bg-300 dark:border-transparent 
                shadow-[0_0_15px_rgba(0,0,0,0.08)] hover:shadow-[0_0_20px_rgba(0,0,0,0.12)]
                focus-within:shadow-[0_0_25px_rgba(0,0,0,0.15)]
                bg-white dark:bg-[#30302E] font-sans antialiased
            `}>

                <div className="flex flex-col px-3 pt-3 pb-2 gap-2">

                    {/* Tabs for Sources */}
                    <div className="flex items-center gap-1 mb-2 px-1 border-b border-bg-300 dark:border-[#454540] pb-2">
                        <button
                            onClick={() => setSelectedSource('document')}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedSource === 'document' ? 'bg-bg-200 dark:bg-[#454540] text-text-100' : 'text-text-400 hover:text-text-200 hover:bg-bg-100 dark:hover:bg-[#383836]'}`}
                        >
                            <Icons.FileText className="w-4 h-4" />
                            Document
                        </button>
                        <button
                            onClick={() => setSelectedSource('website')}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedSource === 'website' ? 'bg-bg-200 dark:bg-[#454540] text-text-100' : 'text-text-400 hover:text-text-200 hover:bg-bg-100 dark:hover:bg-[#383836]'}`}
                        >
                            <Icons.Globe className="w-4 h-4" />
                            Website
                        </button>
                        <button
                            onClick={() => setSelectedSource('youtube')}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedSource === 'youtube' ? 'bg-bg-200 dark:bg-[#454540] text-text-100' : 'text-text-400 hover:text-text-200 hover:bg-bg-100 dark:hover:bg-[#383836]'}`}
                        >
                            <Icons.Youtube className="w-4 h-4" />
                            YouTube
                        </button>
                    </div>

                    {/* Dynamic Source Input Zones */}
                    <div className="px-1 mb-2">
                        {selectedSource === 'document' && (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-bg-300 dark:border-[#454540] hover:border-accent hover:bg-accent/5 dark:hover:bg-accent/10 transition-colors rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer text-text-400 group"
                            >
                                <Icons.Archive className="w-6 h-6 mb-2 group-hover:text-accent transition-colors" />
                                <span className="text-sm font-medium group-hover:text-accent transition-colors">Click to browse or drag and drop</span>
                                <span className="text-xs mt-1 opacity-70">Supports PDF, Markdown, Images...</span>
                            </div>
                        )}
                        {selectedSource === 'website' && (
                            <div className="w-full bg-bg-200 dark:bg-[#2A2A28] rounded-xl px-3 py-2 flex items-center gap-2 border border-transparent focus-within:border-accent/50 transition-colors">
                                <Icons.Globe className="w-4 h-4 text-text-400" />
                                <input 
                                    type="url"
                                    placeholder="Paste website URL here..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="bg-transparent border-none outline-none w-full text-sm text-text-100 placeholder:text-text-400"
                                />
                            </div>
                        )}
                        {selectedSource === 'youtube' && (
                            <div className="w-full bg-bg-200 dark:bg-[#2A2A28] rounded-xl px-3 py-2 flex items-center gap-2 border border-transparent focus-within:border-accent/50 transition-colors">
                                <Icons.Youtube className="w-4 h-4 text-text-400" />
                                <input 
                                    type="url"
                                    placeholder="Paste YouTube URL here..."
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="bg-transparent border-none outline-none w-full text-sm text-text-100 placeholder:text-text-400"
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
                    <div className="relative mb-1">
                        <div className="max-h-96 w-full overflow-y-auto custom-scrollbar font-sans break-words transition-opacity duration-200 min-h-[2.5rem] pl-1">
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onPaste={handlePaste}
                                onKeyDown={handleKeyDown}
                                placeholder="How can I help you today?"
                                className="w-full bg-transparent border-0 outline-none text-text-100 text-[16px] placeholder:text-text-400 resize-none overflow-hidden py-0 leading-relaxed block font-normal antialiased"
                                rows={1}
                                autoFocus
                                style={{ minHeight: '1.5em' }}
                            />
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex gap-2 w-full justify-end items-center">
                        <button
                            onClick={handleSend}
                            disabled={!hasContent}
                            className={`
                                inline-flex items-center justify-center relative shrink-0 transition-colors h-8 w-8 rounded-md active:scale-95 !rounded-xl !h-8 !w-8
                                ${hasContent
                                    ? 'bg-accent text-bg-0 hover:bg-accent-hover shadow-md'
                                    : 'bg-bg-300 text-text-400 dark:bg-[#454540] dark:text-[#8A8A88]'}
                            `}
                            type="button"
                            aria-label="Send message"
                        >
                            <Icons.ArrowUp className="w-4 h-4" />
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
