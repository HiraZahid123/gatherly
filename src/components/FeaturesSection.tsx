"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Smile, Reply, Plus } from "lucide-react";

const FeaturesSection = () => {
    return (
        <section id="features" className="relative w-full py-24 bg-gradient-to-br from-[#ffede6] via-[#ffeef1] to-[#e0f2fe] overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* Header Area */}
                <header className="text-center mb-16 md:mb-24">
                    <h2 className="text-4xl md:text-[3.5rem] lg:text-[4rem] font-extrabold text-black tracking-tighter leading-[1.1] mb-8">
                        Your event starts before the party begins.
                    </h2>
                </header>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left Column - Interactive Cards Display */}
                    <div className="relative flex justify-center items-center h-[500px] md:h-[600px] w-full">
                        {/* Dark Card (Back Layer) */}
                        <div
                            className="absolute bg-[#1a1a1a] text-white p-6 rounded-2xl shadow-2xl w-[280px] md:w-[320px] transition-transform duration-700 hover:rotate-0 rotate-[-6deg] z-10 left-1/2 -translate-x-[65%] top-10 md:top-16 border border-white/10"
                        >
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                RSVPs <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-normal">12 going</span>
                            </h3>

                            <div className="space-y-4">
                                {/* RSVP Item 1 */}
                                <div className="flex items-start gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
                                        <Image
                                            src="/assets/g-1.avif"
                                            alt="Joy"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <p className="text-sm text-white">
                                                <span className="font-bold">Joy</span> <span className="text-[#4ade80] font-semibold">+1</span>
                                            </p>
                                        </div>
                                        <p className="font-medium text-white/90 text-sm">Going 👍</p>
                                        <div className="flex gap-3 mt-1 text-white/40 text-xs items-center font-medium">
                                            <span className="flex items-center gap-1"><Smile size={12} /> 2</span>
                                            <Reply size={12} className="transform scale-x-[-1]" />
                                        </div>
                                    </div>
                                </div>

                                {/* RSVP Item 2 */}
                                <div className="flex items-start gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
                                        <Image
                                            src="/assets/b-2.webp"
                                            alt="Jojo"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <p className="text-sm text-white">
                                                <span className="font-bold">Jojo</span>
                                            </p>
                                        </div>
                                        <p className="font-medium text-white/90 text-sm">Maybe 🤔</p>
                                        <div className="flex gap-3 mt-1 text-white/40 text-xs items-center font-medium">
                                            <span className="flex items-center gap-1"><Smile size={12} /> 4</span>
                                            <Reply size={12} className="transform scale-x-[-1]" />
                                        </div>
                                    </div>
                                </div>

                                {/* RSVP Item 3 */}
                                <div className="flex items-start gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
                                        <Image
                                            src="/assets/g-2.avif"
                                            alt="Jackie"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <p className="text-sm text-white">
                                                <span className="font-bold">Jackie</span>
                                            </p>
                                        </div>
                                        <p className="font-medium text-white/90 text-sm">Going 🤩</p>
                                        <div className="flex gap-3 mt-1 text-white/40 text-xs items-center font-medium">
                                            <span className="flex items-center gap-1"><Smile size={12} /> 3</span>
                                            <Reply size={12} className="transform scale-x-[-1]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Light Card (Front Layer) - Glassmorphism style to match app */}
                        <div
                            className="absolute bg-white/90 backdrop-blur-md text-gray-900 p-6 rounded-2xl shadow-xl w-[280px] md:w-[320px] transition-transform duration-700 hover:rotate-0 rotate-[6deg] z-20 left-1/2 -translate-x-[35%] top-32 md:top-36 border border-white/40"
                        >
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                Chat <MessageCircle size={18} className="text-brand-green" />
                            </h3>

                            <div className="space-y-4 mb-6">
                                {/* Chat Item 1 */}
                                <div className="flex items-start gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
                                        <Image
                                            src="/assets/b-3.webp"
                                            alt="Sammy"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-sm">sammy</span>
                                            <span className="text-[10px] text-gray-400">15m</span>
                                        </div>
                                        <div className="mt-0.5">
                                            <span className="bg-[#ef4444] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-block align-middle mr-1 uppercase">SOS</span>
                                            <span className="text-sm leading-snug text-gray-800">any more drinks?</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Item 2 */}
                                <div className="flex items-start gap-3">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-100">
                                        <Image
                                            src="/assets/b-4.webp"
                                            alt="Ryan"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="font-bold text-sm">Ryan</span>
                                            <span className="text-[10px] text-gray-400">6m</span>
                                        </div>
                                        <p className="text-sm mt-0.5 leading-snug text-gray-800">omw with seltzers 😃</p>
                                    </div>
                                </div>
                            </div>

                            {/* Comment Input Area */}
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-200">
                                    <Image
                                        src="/assets/b-1.avif"
                                        alt="Current User"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                                    <span className="text-gray-400 text-sm">Leave a comment</span>
                                </div>
                            </div>
                        </div>

                        {/* Decorative Elements (matching hero) */}
                        <div className="absolute -top-10 -right-10 w-20 h-20 bg-brand-green/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-brand-gold/10 rounded-full blur-3xl animate-pulse delay-700"></div>
                    </div>

                    {/* Right Column - Text Content */}
                    <div className="flex flex-col items-center lg:items-start text-center lg:text-left px-4 lg:pl-12">
                        <h3 className="text-3xl md:text-5xl font-bold text-black mb-6 tracking-tight">
                            See who&apos;s going 👀
                        </h3>
                        <p className="text-lg md:text-xl text-gray-700 mb-10 max-w-lg leading-relaxed">
                            Stalk the guest list, leave comments, reply to friends, and add reactions. Keep the party going long after the event starts.
                        </p>
                        <Link
                            href="/auth/signup"
                            className="bg-black hover:bg-gray-800 text-white text-base font-semibold py-4 px-10 rounded-2xl transition duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 block w-fit"
                        >
                            Create your event
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;
