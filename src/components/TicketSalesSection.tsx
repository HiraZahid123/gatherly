"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, CreditCard, QrCode, ShieldCheck, Ticket } from "lucide-react";
import { motion } from "framer-motion";

const benefits = [
    {
        icon: Ticket,
        title: "Flexible ticket tiers",
        text: "Create General Admission, VIP, or custom tiers with quantities and pricing.",
    },
    {
        icon: CreditCard,
        title: "Collect payments in NGN",
        text: "Give guests a smooth checkout experience while keeping every order attached to the event.",
    },
    {
        icon: QrCode,
        title: "QR code entry",
        text: "Every ticket generates a unique QR code that your team can scan at the gate for entry.",
    },
    {
        icon: BarChart3,
        title: "See what is selling",
        text: "Track ticket quantities, revenue, recent orders, and tier performance in one view.",
    },
];

export default function TicketSalesSection() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 48 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden bg-[#f5f1e9] py-24 text-[#101713]"
        >
            <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className="absolute -bottom-32 left-10 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-12">
                <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.15, duration: 0.65 }}
                >
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-700/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-800">
                        <Ticket className="h-3.5 w-3.5" /> Ticket sales
                    </span>
                    <h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl">
                        Sell tickets with QR entry built in.
                    </h2>
                    <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#405047]">
                        Sell tickets, manage capacity, and keep your guest list and payments together. Every guest gets a digital ticket with a QR code to scan at the gate.
                    </p>
                    <Link
                        href="/events/create"
                        className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#101713] px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-emerald-900"
                    >
                        Sell tickets for your event
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 24, scale: 0.96 }}
                    whileInView={{ opacity: 1, x: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ delay: 0.28, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="relative rounded-[2rem] border border-black/10 bg-[#101713] p-4 shadow-[0_30px_70px_rgba(16,23,19,0.2)] sm:p-6"
                >
                    <div className="grid gap-4 sm:grid-cols-[0.85fr_1.15fr]">
                        <div className="relative min-h-[280px] overflow-hidden rounded-2xl bg-emerald-950">
                            <Image
                                src="/partiful/disco-pride.avif"
                                alt="Event ticket sales preview"
                                fill
                                className="object-cover opacity-80"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                            <div className="absolute bottom-5 left-5 right-5 text-white">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Live event</p>
                                <p className="mt-2 text-2xl font-black leading-tight">Igbẻdύ Fiesta</p>
                                <p className="mt-1 text-xs text-white/70">Tickets from NGN 10,000</p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-white">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">Sales overview</p>
                                <span className="rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-300">Live</span>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white/[0.06] p-3">
                                    <p className="text-[10px] uppercase tracking-widest text-white/40">Sold</p>
                                    <p className="mt-1 text-2xl font-black">248</p>
                                </div>
                                <div className="rounded-xl bg-white/[0.06] p-3">
                                    <p className="text-[10px] uppercase tracking-widest text-white/40">Revenue</p>
                                    <p className="mt-1 text-2xl font-black">NGN 2.4m</p>
                                </div>
                            </div>
                            <div className="mt-5 space-y-3">
                                <div className="flex items-center justify-between text-xs"><span className="text-white/60">VIP</span><span className="font-bold">86 / 100</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 w-[86%] rounded-full bg-emerald-400" /></div>
                                <div className="flex items-center justify-between text-xs"><span className="text-white/60">General Admission</span><span className="font-bold">162 / 300</span></div>
                                <div className="h-2 rounded-full bg-white/10"><div className="h-2 w-[54%] rounded-full bg-amber-300" /></div>
                            </div>
                            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-[#101713]">
                                    <QrCode className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-emerald-200">QR entry pass generated</p>
                                    <p className="mt-1 text-[11px] text-white/55">Scan at the gate to check in</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                className="relative mx-auto mt-16 grid max-w-7xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-12"
            >
                {benefits.map(({ icon: Icon, title, text }) => (
                    <motion.div
                        key={title}
                        variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
                        transition={{ duration: 0.45 }}
                        className="border-t border-black/10 pt-4"
                    >
                        <Icon className="h-5 w-5 text-emerald-800" />
                        <h3 className="mt-3 text-sm font-black">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#58675f]">{text}</p>
                    </motion.div>
                ))}
            </motion.div>
        </motion.section>
    );
}
