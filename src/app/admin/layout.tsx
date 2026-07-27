"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Users,
    Calendar,
    ShieldAlert,
    LogOut,
    ExternalLink,
    BookOpen,
} from "lucide-react";

const NAV = [
    { href: "/admin",            label: "Overview",    icon: LayoutDashboard },
    { href: "/admin/users",      label: "Users",       icon: Users },
    { href: "/admin/events",     label: "Events",      icon: Calendar },
    { href: "/admin/moderation", label: "Moderation",  icon: ShieldAlert },
    { href: "/admin/blog",       label: "Blog",        icon: BookOpen },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    return (
        <div className="min-h-screen bg-[#050505] text-white flex font-sans antialiased">
            {/* Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-[#0a0a0b] flex flex-col fixed inset-y-0 z-50">
                <div className="p-8 pb-12">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-black font-black text-xs">G</div>
                        <span className="text-xl font-black tracking-tighter">JollyWitMe.<span className="text-white/40">ops</span></span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Core Management</h3>
                    {NAV.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                                    active
                                        ? "bg-white/5 text-white border border-white/10 shadow-lg"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-6 border-t border-white/10 space-y-4">
                    <Link href="/" className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        <span>Go to App</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/admin/login" })}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500/60 hover:text-red-500 transition-colors text-xs font-black uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Terminate Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-72 p-12">
                {children}
            </main>
        </div>
    );
}
