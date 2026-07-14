"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, Mic, Megaphone, Send } from "lucide-react";

const TextBlastSection = () => {
    return (
        <section className="relative w-full py-24 bg-gradient-to-br from-[#E0F7FA] to-[#FCE4EC] overflow-hidden">
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
                    {/* Left Column - Text Content */}
                    <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-8">
                        <h2 className="text-5xl md:text-7xl font-extrabold text-black tracking-tight leading-[1.05]">
                            Text Blast your guests
                        </h2>
                        <p className="text-lg md:text-xl text-gray-800 leading-relaxed max-w-lg">
                            Running late, need more drinks, or 10 people texting you asking for the gate code? Send updates to everyone at once with a single click.
                        </p>
                        <Link
                            href="/auth/signup"
                            className="bg-black hover:bg-gray-800 text-white font-bold py-4 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 block w-fit"
                        >
                            Create event
                        </Link>
                    </div>

                    {/* Right Column - Visual Mockup (Phone) */}
                    <div className="w-full md:w-1/2 flex justify-center">
                        {/* Phone Container */}
                        <div className="relative w-full max-w-[340px] bg-white rounded-[3rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden border-[8px] border-black/5">
                            {/* Card Header (Mint/Teal) */}
                            <div className="bg-[#80CBC4] aspect-[4/3] w-full flex flex-col items-center justify-center relative p-8">
                                {/* Avatar */}
                                <div className="relative mb-3">
                                    <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-lg bg-gray-200">
                                        <Image
                                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"
                                            alt="Host Avatar"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    {/* Megaphone Emoji Overlay */}
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-2 shadow-md flex items-center justify-center">
                                        <Megaphone size={20} className="text-brand-green" />
                                    </div>
                                </div>

                                {/* Wavy Decoration */}
                                <div className="mt-2 opacity-30">
                                    <svg fill="none" height="8" viewBox="0 0 40 6" width="60" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0 3C2 1 3 1 5 3C7 5 8 5 10 3C12 1 13 1 15 3C17 5 18 5 20 3C22 1 23 1 25 3C27 5 28 5 30 3C32 1 33 1 35 3C37 5 38 5 40 3" fill="none" stroke="black" strokeWidth="2"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Card Body (iMessage Style) */}
                            <div className="p-6 space-y-4 bg-white min-h-[220px] flex flex-col justify-end">
                                {/* System Message */}
                                <div className="flex flex-col space-y-1 items-start">
                                    <div className="bg-gray-100 text-black px-4 py-2.5 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-snug">
                                        <span className="font-semibold">Birthday Bash:</span> The host sent you a Text Blast 📣
                                    </div>
                                </div>

                                {/* Personal Update */}
                                <div className="flex flex-col space-y-1 items-start">
                                    <div className="bg-gray-100 text-black px-4 py-2.5 rounded-2xl rounded-tl-none max-w-[85%] text-sm leading-snug font-medium shadow-sm">
                                        Hey!! Buzz #2... 🏢 Doors are open!
                                    </div>
                                </div>
                            </div>

                            {/* iMessage Input Bar */}
                            <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-gray-200 rounded-full p-2 text-gray-500 cursor-pointer hover:bg-gray-300 transition">
                                        <Camera size={18} />
                                    </div>
                                    <div className="flex-grow relative">
                                        <div className="w-full bg-white border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm text-gray-400">
                                            iMessage
                                        </div>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Mic size={18} />
                                        </div>
                                    </div>
                                    <div className="bg-emerald-500 rounded-full p-2 text-white shadow-md">
                                        <Send size={18} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Background Assets */}
                        <div className="absolute -z-10 top-0 right-0 w-64 h-64 bg-yellow-100/50 rounded-full blur-3xl"></div>
                        <div className="absolute -z-10 bottom-0 left-0 w-64 h-64 bg-cyan-100/50 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TextBlastSection;
