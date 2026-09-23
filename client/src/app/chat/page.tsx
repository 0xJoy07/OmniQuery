"use client";
import React, { useState, useEffect } from "react";
import BoxLoader from "@/components/ui/box-loader";
import ChatInterface from "@/components/chat-interface";

export default function ChatPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading sequence for the chat UI
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // 2.5 seconds preloader
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <BoxLoader />
        <p className="mt-16 text-[#FF6B2C] font-mono text-sm animate-pulse tracking-widest">
          INITIALIZING OMNIQUERY...
        </p>
      </div>
    );
  }

  return <ChatInterface />;
}
