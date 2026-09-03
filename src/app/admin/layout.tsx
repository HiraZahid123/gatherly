"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
    Sparkles,
    Smartphone,
} from "lucide-react";

const NAV = [
    { href: "/admin",                 label: "Overview",     icon: LayoutDashboard },
    { href: "/admin/users",           label: "Users",        icon: Users },
    { href: "/admin/events",          label: "Events",       icon: Calendar },
    { href: "/admin/templates",       label: "Templates",    icon: Sparkles },
    { href: "/admin/whatsapp",        label: "WhatsApp Bot", icon: Smartphone },
    { href: "/admin/moderation",      label: "Moderation",   icon: ShieldAlert },
    { href: "/admin/blog",            label: "Blog",         icon: BookOpen },
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
                <div className="p-8 pb-10">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative h-9 w-36 transition-transform group-hover:scale-105">
                            <Image
                                src="/logo/logo-full.webp"
                                alt="JollyWitMe"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            OPS
                        </span>
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
            <main className="flex-1 ml-72 p-6 lg:p-10 xl:p-12 min-w-0 w-[calc(100%-18rem)] max-w-[calc(100vw-18rem)] overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
