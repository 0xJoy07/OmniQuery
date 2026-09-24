"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, History, Settings } from 'lucide-react';

const LINKS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
    { href: '/dashboard/history', label: 'History', icon: History },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 shrink-0 md:min-h-screen">
            <div className="p-4 overflow-x-auto md:overflow-visible">
                <nav className="flex md:flex-col gap-2 min-w-max md:min-w-0">
                    {LINKS.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                    isActive
                                        ? 'bg-[#FF6B2C]/10 text-[#FF6B2C] border border-[#FF6B2C]/20'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                                }`}
                            >
                                <Icon size={18} />
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
