"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                // Headings
                h1: ({ children }) => (
                    <h1 className="text-xl font-bold text-white mt-6 mb-3 first:mt-0 border-b border-zinc-800 pb-2">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-white mt-5 mb-2 first:mt-0">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-zinc-200 mt-4 mb-2 first:mt-0">
                        {children}
                    </h3>
                ),
                h4: ({ children }) => (
                    <h4 className="text-sm font-semibold text-zinc-300 mt-3 mb-1 first:mt-0">
                        {children}
                    </h4>
                ),

                // Paragraphs
                p: ({ children }) => (
                    <p className="text-[15px] leading-7 text-zinc-300 mb-3 last:mb-0">
                        {children}
                    </p>
                ),

                // Strong / Bold
                strong: ({ children }) => (
                    <strong className="font-semibold text-white">{children}</strong>
                ),

                // Emphasis / Italic
                em: ({ children }) => (
                    <em className="text-zinc-200 italic">{children}</em>
                ),

                // Links
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FF6B2C] hover:text-[#ff8a57] underline underline-offset-2 decoration-[#FF6B2C]/30 hover:decoration-[#FF6B2C]/60 transition-colors"
                    >
                        {children}
                    </a>
                ),

                // Inline code
                code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                        return (
                            <code className="px-1.5 py-0.5 bg-zinc-800 text-[#FF6B2C] text-[13px] rounded-md font-mono border border-zinc-700/50">
                                {children}
                            </code>
                        );
                    }
                    // Code block
                    const language = className?.replace("language-", "") || "";
                    return (
                        <div className="my-3 rounded-xl overflow-hidden border border-zinc-800 bg-[#0a0a0a]">
                            {language && (
                                <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-zinc-800">
                                    <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                                        {language}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const text = String(children).replace(/\n$/, "");
                                            navigator.clipboard.writeText(text);
                                        }}
                                        className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                            )}
                            <pre className="p-4 overflow-x-auto">
                                <code className={`text-[13px] leading-6 font-mono text-zinc-300 ${className || ""}`} {...props}>
                                    {children}
                                </code>
                            </pre>
                        </div>
                    );
                },

                // Pre (wrapping code blocks)
                pre: ({ children }) => <>{children}</>,

                // Unordered list
                ul: ({ children }) => (
                    <ul className="my-2 ml-1 space-y-1.5">{children}</ul>
                ),

                // Ordered list
                ol: ({ children }) => (
                    <ol className="my-2 ml-1 space-y-1.5 list-decimal list-inside">{children}</ol>
                ),

                // List items
                li: ({ children, ordered, ...props }) => (
                    <li className="text-[15px] leading-7 text-zinc-300 flex items-start gap-2" {...props}>
                        {!(props as Record<string, unknown>).ordered && (
                            <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-[#FF6B2C]/60 shrink-0" />
                        )}
                        <span className="flex-1">{children}</span>
                    </li>
                ),

                // Blockquote
                blockquote: ({ children }) => (
                    <blockquote className="my-3 pl-4 border-l-2 border-[#FF6B2C]/40 text-zinc-400 italic">
                        {children}
                    </blockquote>
                ),

                // Horizontal rule
                hr: () => <hr className="my-4 border-zinc-800" />,

                // Table
                table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-lg border border-zinc-800">
                        <table className="w-full text-sm">{children}</table>
                    </div>
                ),
                thead: ({ children }) => (
                    <thead className="bg-zinc-900/80 border-b border-zinc-800">
                        {children}
                    </thead>
                ),
                th: ({ children }) => (
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="px-4 py-2.5 text-zinc-300 border-t border-zinc-800/50">
                        {children}
                    </td>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
};
