"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, History, Settings } from 'lucide-react';
import { Sidebar as AceternitySidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';

const MAIN_LINKS = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} className="text-neutral-200 shrink-0" /> },
    { href: '/dashboard/profile', label: 'Profile', icon: <User size={20} className="text-neutral-200 shrink-0" /> },
    { href: '/dashboard/history', label: 'History', icon: <History size={20} className="text-neutral-200 shrink-0" /> },
];

const SETTINGS_LINK = { href: '/dashboard/settings', label: 'Settings', icon: <Settings size={20} className="text-neutral-200 shrink-0" /> };

export default function Sidebar() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <AceternitySidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10 !px-0 py-4">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden px-2">
                    <div className="mt-4 flex flex-col gap-2">
                        {MAIN_LINKS.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <SidebarLink
                                    key={link.href}
                                    link={{
                                        ...link,
                                        icon: React.cloneElement(link.icon as React.ReactElement, {
                                            className: isActive ? 'text-[#FF6B2C] shrink-0' : 'text-neutral-400 group-hover/sidebar:text-neutral-200 shrink-0'
                                        })
                                    }}
                                    className={`rounded-lg transition-colors ${
                                        isActive ? 'bg-[#FF6B2C]/10' : 'hover:bg-zinc-800/50'
                                    }`}
                                />
                            );
                        })}
                    </div>
                </div>
                
                {/* Settings pinned to bottom via justify-between */}
                <div className="shrink-0 pb-4 px-2">
                    <SidebarLink
                        link={{
                            ...SETTINGS_LINK,
                            icon: React.cloneElement(SETTINGS_LINK.icon as React.ReactElement, {
                                className: pathname === SETTINGS_LINK.href ? 'text-[#FF6B2C] shrink-0' : 'text-neutral-400 group-hover/sidebar:text-neutral-200 shrink-0'
                            })
                        }}
                        className={`rounded-lg transition-colors ${
                            pathname === SETTINGS_LINK.href ? 'bg-[#FF6B2C]/10' : 'hover:bg-zinc-800/50'
                        }`}
                    />
                </div>
            </SidebarBody>
        </AceternitySidebar>
    );
}
