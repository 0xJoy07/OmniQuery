"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleAuth = async () => {
        if (!email || !password || (isSignUp && !name)) {
            setError("Please fill in all required fields.");
            return;
        }
        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        
        setError("");
        setIsLoading(true);

        const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
        const body = isSignUp ? { name, email, password } : { email, password };

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Authentication failed");
            }

            // Success! Redirect to chat
            router.push("/chat");
            router.refresh();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#121212] relative overflow-hidden w-full font-sans">
            {/* Centered glass card */}
            <div className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-r from-[#ffffff10] to-[#121212] backdrop-blur-sm shadow-2xl p-8 flex flex-col items-center border border-white/5">
                {/* Logo */}
                <div className="flex items-center justify-center mb-6">
                    <img 
                        src="https://cdn.21st.dev/assets/mirror/68/6896117aefeca6a69a2ed98a88c9753acdb1e47b0d54b7b4fa63c7ab59e10f5b.png" 
                        alt="OmniQuery Logo" 
                        className="w-20 h-auto object-contain"
                    />
                </div>
                {/* Title */}
                <h2 className="text-2xl font-semibold text-white mb-6 text-center tracking-tight">
                    OmniQuery
                </h2>
                {/* Form */}
                <div className="flex flex-col w-full gap-4">
                    <div className="w-full flex flex-col gap-3">
                        {isSignUp && (
                            <input
                                placeholder="Full Name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/50 transition-all"
                            />
                        )}
                        <input
                            placeholder="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/50 transition-all"
                        />
                        <input
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl bg-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B2C]/50 transition-all"
                        />
                        {error && (
                            <div className="text-sm text-red-400 text-left px-1">{error}</div>
                        )}
                    </div>
                    
                    <hr className="border-white/10 my-1" />
                    
                    <div>
                        <button
                            onClick={handleAuth}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 bg-[#FF6B2C] text-black font-semibold px-5 py-3 rounded-full shadow-lg shadow-[#FF6B2C]/20 hover:bg-[#FF6B2C]/90 transition-all mb-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                isSignUp ? "Sign up" : "Sign in"
                            )}
                        </button>
                        
                        <div className="w-full text-center mt-3">
                            <span className="text-xs text-gray-400">
                                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                                <button
                                    onClick={() => {
                                        setIsSignUp(!isSignUp);
                                        setError("");
                                    }}
                                    className="underline text-white/80 hover:text-white transition-colors"
                                >
                                    {isSignUp ? "Sign in" : "Sign up, it's free!"}
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
