import { cookies } from 'next/headers';
import Link from 'next/link';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { verifyToken } from '@/lib/auth/jwt';

export default async function Navbar() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    let user = null;

    if (token) {
        user = await verifyToken(token);
    }

    return (
        <nav className="w-full bg-slate-950 border-b border-slate-800 text-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left - Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <img 
                            src="https://cdn.21st.dev/assets/mirror/68/6896117aefeca6a69a2ed98a88c9753acdb1e47b0d54b7b4fa63c7ab59e10f5b.png" 
                            alt="OmniQuery Logo" 
                            className="w-10 h-auto object-contain"
                        />
                        <span className="font-bold text-lg tracking-tight">OmniQuery</span>
                    </Link>

                    {/* Center - Links */}
                    <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <Link href="/chat" className="hover:text-white transition-colors">Chat</Link>
                        <Link href="/dashboard/profile" className="hover:text-white transition-colors">Profile</Link>
                    </div>

                    {/* Right - Auth */}
                    <div className="flex items-center gap-4">
                        {!user ? (
                            <Link
                                href="/login"
                                className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-colors"
                            >
                                Login
                            </Link>
                        ) : (
                            <div className="relative group">
                                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-[#FF6B2C]/20 border border-[#FF6B2C]/50 flex items-center justify-center text-[#FF6B2C] font-semibold text-sm">
                                        {(user.name as string)?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <ChevronDown size={14} className="text-slate-400" />
                                </button>

                                {/* Dropdown */}
                                <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                    <div className="p-2 space-y-1">
                                        <div className="px-3 py-2 border-b border-slate-800 mb-1">
                                            <p className="text-sm font-medium text-white truncate">{(user.name as string) || 'User'}</p>
                                            <p className="text-xs text-slate-400 truncate">{(user.email as string) || ''}</p>
                                        </div>
                                        <Link href="/dashboard/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                                            <User size={14} /> Profile
                                        </Link>
                                        <Link href="/dashboard/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
                                            <Settings size={14} /> Settings
                                        </Link>
                                        <form action={async () => {
                                            'use server';
                                            // Call the Express backend to blacklist the token
                                            const { cookies: getCookies } = await import('next/headers');
                                            const cookieStore = await getCookies();
                                            const sessionToken = cookieStore.get('session_token')?.value;

                                            if (sessionToken) {
                                                try {
                                                    await fetch('http://localhost:5001/api/auth/logout', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Cookie': `session_token=${sessionToken}`,
                                                        },
                                                    });
                                                } catch (e) {
                                                    console.error('Logout API call failed:', e);
                                                }
                                            }

                                            // Clear the cookie on the Next.js side too
                                            cookieStore.delete('session_token');
                                            const { redirect } = await import('next/navigation');
                                            redirect('/');
                                        }}>
                                            <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-lg transition-colors text-left">
                                                <LogOut size={14} /> Logout
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
