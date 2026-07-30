"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function Footer() {
    const pathname = usePathname();

    const isDashboard = pathname === "/dashboard";
    const isAdminPage = pathname.startsWith("/admin");
    const isCreationPage = pathname === "/events/create" || pathname === "/cards/create";

    if (isDashboard || isAdminPage || isCreationPage) return null;

    return (
        <footer className="bg-black text-white pt-20 pb-10 border-t border-white/10">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
                            <Logo variant="neon" />
                        </Link>
                        <p className="text-white/60 text-sm mb-6 max-w-xs">
                            The easiest way to get your guests on the same page. Start planning your next memorable event today.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">Explore</h4>
                        <ul className="space-y-3 text-sm text-white/70">
                            <li><Link href="/summer-parties" className="hover:text-white transition-colors">Summer Parties</Link></li>
                            <li><Link href="/birthdays" className="hover:text-white transition-colors">Birthdays</Link></li>
                            <li><Link href="/dinners" className="hover:text-white transition-colors">Dinners</Link></li>
                            <li><Link href="/housewarmings" className="hover:text-white transition-colors">Housewarmings</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">Resources</h4>
                        <ul className="space-y-3 text-sm text-white/70">
                            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                            <li><Link href="/dashboard" className="hover:text-white transition-colors">My Events</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-semibold text-lg mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-white/70">
                            <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-white/40">
                    <p>&copy; {new Date().getFullYear()} JollyWitMe. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
