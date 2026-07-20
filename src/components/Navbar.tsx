"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, Plus, LogIn, Menu, X, LayoutDashboard, Settings, LogOut, ChevronDown, BookOpen, Compass } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
    const { data: session, status } = useSession();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const createMenuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    const isAuthenticated = status === "authenticated";
    const user = session?.user;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
            if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
                setIsCreateMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isHomePage = pathname === "/";
    const isDashboard = pathname === "/dashboard";
    const isAdminPage = pathname.startsWith("/admin");
    const isHelpPage = pathname.startsWith("/help") || pathname.startsWith("/blog");
    const isCreationPage = pathname === "/events/create" || pathname === "/cards/create";

    if (isDashboard || isAdminPage) return null;

    // Determine config based on scroll state
    const navClasses = isHelpPage 
        ? `sticky top-0 left-0 right-0 z-[100] bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10 py-4`
        : `absolute top-0 left-0 right-0 z-[100] transition-all duration-300 bg-transparent py-5`;

    const finalNavClasses = navClasses;
    const finalLogoWhite = true; // Use white logo on transparent background
    const finalLinkColor = "text-white/90";
    const finalLinkBackground = "bg-transparent";

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : (user as any)?.phone?.charAt(0) || "U";

    return (
        <nav className={finalNavClasses}>
            <div className="container mx-auto px-6 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center group">
                    <div className="relative w-16 h-16 mr-3 transition-transform group-hover:scale-110">
                        <Image
                            src={finalLogoWhite ? "/logo/logo-white.svg" : "/logo/logo.svg"}
                            alt="Gatherly Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <span className={`text-2xl font-bold tracking-tight transition-colors ${finalLogoWhite ? "text-white" : "bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"
                        }`}>
                        Gatherly
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                    {/* <Link
                        href="/#features"
                        className={`${finalLinkColor} transition-colors text-sm font-medium hover:text-green-400`}
                    >
                        How it Works
                    </Link> */}
                    <Link
                        href="/summer-parties"
                        className={`${finalLinkColor} transition-colors text-sm font-medium hover:text-green-400`}
                    >
                        Summer Parties
                    </Link>
                    <Link
                        href="/birthdays"
                        className={`${finalLinkColor} transition-colors text-sm font-medium hover:text-green-400`}
                    >
                        Birthdays
                    </Link>
                    <Link
                        href="/dinners"
                        className={`${finalLinkColor} transition-colors text-sm font-medium hover:text-green-400`}
                    >
                        Dinners
                    </Link>
                    <Link
                        href="/housewarmings"
                        className={`${finalLinkColor} transition-colors text-sm font-medium hover:text-green-400`}
                    >
                        Housewarmings
                    </Link>
                    <Link
                        href="/explore"
                        className={`${finalLinkColor} transition-colors text-sm font-medium hover:text-green-400`}
                    >
                        Explore
                    </Link>
                    {isAuthenticated && (
                        <Link
                            href="/dashboard"
                            className={`${finalLinkColor} transition-colors text-sm font-medium hover:text-green-400`}
                        >
                            My Events
                        </Link>
                    )}
                    {!isCreationPage && (
                    <div className="relative" ref={createMenuRef}>
                        <button
                            onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                            className={`flex items-center space-x-2 text-white px-5 py-2.5 rounded-full transition-all text-sm font-bold shadow-lg transform hover:-translate-y-0.5 border ${
                                isCreateMenuOpen
                                    ? "bg-white/10 border-white/20 shadow-green-500/20 shadow-xl"
                                    : "bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 border-transparent hover:shadow-green-500/30 hover:shadow-xl"
                            }`}
                        >
                            <Plus size={17} className={`transition-transform duration-300 ${isCreateMenuOpen ? "rotate-45" : ""}`} />
                            <span>Create</span>
                        </button>

                        {/* Create Dropdown */}
                        {isCreateMenuOpen && (
                            <div className="absolute left-0 mt-3 w-[290px] bg-[#0a0a0b]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 z-[110]"
                                style={{boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(139,92,246,0.2)"}}>
                                {/* Purple accent top strip */}
                                <div className="h-px w-full bg-gradient-to-r from-transparent via-green-500/60 to-transparent" />

                                <div className="p-2 space-y-0.5">
                                    {/* New Event */}
                                    <Link
                                        href="/events/create"
                                        className="group flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all duration-150 hover:bg-green-500/10"
                                        onClick={() => setIsCreateMenuOpen(false)}
                                    >
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg shadow-green-900/40 group-hover:shadow-green-600/40 transition-shadow">
                                            <Plus size={17} className="text-white" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-semibold text-white leading-tight">New event</p>
                                            <p className="text-xs text-white/40 mt-0.5">Collect RSVPs from guests</p>
                                        </div>
                                        <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 opacity-50 group-hover:opacity-90 transition-opacity duration-300 border border-white/10">
                                            <Image src="/ui/event-preview.png" alt="" fill className="object-cover scale-100 group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                    </Link>

                                    {/* Thin divider */}
                                    <div className="px-3"><div className="h-px bg-white/[0.05]" /></div>

                                    {/* Send a Card */}
                                    <Link
                                        href="/cards/create"
                                        className="group flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all duration-150 hover:bg-yellow-500/10"
                                        onClick={() => setIsCreateMenuOpen(false)}
                                    >
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-yellow-600 to-green-600 shadow-lg shadow-yellow-900/40 group-hover:shadow-yellow-600/40 transition-shadow">
                                            <Plus size={17} className="text-white" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="text-sm font-semibold text-white leading-tight">Send a card</p>
                                            <p className="text-xs text-white/40 mt-0.5">Congratulate someone</p>
                                        </div>
                                        <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 opacity-50 group-hover:opacity-90 transition-opacity duration-300 border border-white/10">
                                            <Image src="/ui/card-preview.png" alt="" fill className="object-cover scale-100 group-hover:scale-110 transition-transform duration-500" />
                                        </div>
                                    </Link>
                                </div>
                                <div className="h-2" />
                            </div>
                        )}
                    </div>
                    )}
                    <div className={`h-4 w-[1px] bg-white/20`} />

                    {status === "loading" ? (
                        <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
                    ) : isAuthenticated ? (
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center space-x-2 pl-1 pr-3 py-1 rounded-full transition-all border border-transparent hover:border-white/20"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden">
                                    {user?.image ? (
                                        <Image src={user.image} alt={user.name || ""} width={32} height={32} className="rounded-full object-cover" unoptimized referrerPolicy="no-referrer" />
                                    ) : (
                                        <span>{userInitial}</span>
                                    )}
                                </div>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""} ${finalLinkColor}`} />
                            </button>

                            {/* User Dropdown */}
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden ring-1 ring-black/5">
                                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Signed in as</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name || (user as any)?.phone || "User"}</p>
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <User size={16} />
                                        <span>Profile</span>
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 transition-colors"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <LayoutDashboard size={16} />
                                        <span>Dashboard</span>
                                    </Link>
                                    <div className="h-[1px] bg-gray-100 my-1" />
                                    <button
                                        onClick={() => signOut()}
                                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={16} />
                                        <span>Log Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/auth/signin"
                            className={`flex items-center space-x-2 ${finalLinkColor} font-bold`}
                        >
                            <LogIn size={18} />
                            <span>Sign In</span>
                        </Link>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={`md:hidden p-2 ${finalLinkColor}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={24} /> : (
                        isAuthenticated ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FD0BD7] to-[#9D00FF] flex items-center justify-center text-xs font-bold ring-2 ring-white/20 text-white overflow-hidden">
                                {user?.image ? (
                                    <Image src={user.image} alt={user.name || ""} width={32} height={32} className="object-cover" unoptimized referrerPolicy="no-referrer" />
                                ) : (
                                    userInitial
                                )}
                            </div>
                        ) : (
                            <Menu size={24} />
                        )
                    )}
                </button>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className={`md:hidden absolute top-full left-0 right-0 border-b p-6 flex flex-col space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-xl bg-[#0a0a0b]/95 backdrop-blur-lg border-white/10`}>
                    <Link
                        href="/#features"
                        onClick={() => setIsMenuOpen(false)}
                        className={`text-lg font-medium flex items-center space-x-3 text-white`}
                    >
                        <Plus size={20} className={"text-white/50"} />
                        <span>How it Works</span>
                    </Link>
                    <Link
                        href="/blog"
                        onClick={() => setIsMenuOpen(false)}
                        className={`text-lg font-medium flex items-center space-x-3 text-white`}
                    >
                        <BookOpen size={20} className={"text-white/50"} />
                        <span>Blog</span>
                    </Link>
                    <Link
                        href="/explore"
                        onClick={() => setIsMenuOpen(false)}
                        className={`text-lg font-medium flex items-center space-x-3 text-white`}
                    >
                        <Compass size={20} className={"text-white/50"} />
                        <span>Explore</span>
                    </Link>
                    <Link
                        href="/help"
                        onClick={() => setIsMenuOpen(false)}
                        className={`text-lg font-medium flex items-center space-x-3 text-white`}
                    >
                        <Settings size={20} className={"text-white/50"} />
                        <span>Help Center</span>
                    </Link>
                    {isAuthenticated && (
                        <Link
                            href="/dashboard"
                            onClick={() => setIsMenuOpen(false)}
                            className={`text-lg font-medium flex items-center space-x-3 text-white`}
                        >
                            <LayoutDashboard size={20} className={"text-white/50"} />
                            <span>My Events</span>
                        </Link>
                    )}
                    <div className="space-y-3">
                        <Link
                            href="/events/create"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center space-x-4 bg-white/5 border border-white/10 p-4 rounded-xl text-white hover:bg-white/10 transition-colors"
                        >
                            <div className="bg-green-600 p-2 rounded-full">
                                <Plus size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold">New event</p>
                                <p className="text-xs text-white/50">Collect RSVPs</p>
                            </div>
                        </Link>
                        <Link
                            href="/cards/create"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center space-x-4 bg-white/5 border border-white/10 p-4 rounded-xl text-white hover:bg-white/10 transition-colors"
                        >
                            <div className="bg-emerald-600 p-2 rounded-full">
                                <Plus size={20} />
                            </div>
                            <div className="text-left">
                                <p className="font-bold">Send a card</p>
                                <p className="text-xs text-white/50">Congratulate someone</p>
                            </div>
                        </Link>
                    </div>

                    {isAuthenticated ? (
                        <>
                            <div className={`h-[1px] my-2 bg-white/10`} />
                            <Link
                                href="/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className={`text-lg font-medium flex items-center space-x-3 text-white`}
                            >
                                <User size={20} className={"text-white/50"} />
                                <span>Profile</span>
                            </Link>
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    signOut();
                                }}
                                className="flex items-center space-x-3 text-red-500 text-lg font-medium mt-2"
                            >
                                <LogOut size={20} />
                                <span>Log Out</span>
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/auth/signin"
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center justify-center space-x-2 border-2 px-6 py-3 rounded-xl font-bold border-white text-white`}
                        >
                            <LogIn size={18} />
                            <span>Sign In</span>
                        </Link>
                    )}
                </div>
            )}
        </nav>
    );
}
