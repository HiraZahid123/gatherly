import Link from "next/link";
import { getAllBlogPostsFromDB, formatDate } from "@/lib/blog-data";
import { ArrowRight, Clock, BookOpen } from "lucide-react";

export const metadata = {
    title: "Blog — JollyWitMe",
    description: "Event planning guides, psychology, and design advice from the JollyWitMe team.",
};

export default async function BlogListPage() {
    const posts = await getAllBlogPostsFromDB();
    const [featured, ...rest] = posts;

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Ambient background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-900/20 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/15 blur-[160px] rounded-full" />
            </div>

            {/* ─── Hero / page header ─────────────────────────────── */}
            <section className="relative z-10 pt-32 pb-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                        <BookOpen className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-bold text-green-400 uppercase tracking-widest">The JollyWitMe Blog</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-4">
                        Ideas for better<br />
                        <span className="bg-gradient-to-r from-green-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            events
                        </span>
                    </h1>
                    <p className="text-white/50 text-lg max-w-xl">
                        Guides, psychology, and design advice from the people building the world's best event platform.
                    </p>
                </div>
            </section>

            {/* ─── Featured post ───────────────────────────────────── */}
            <section className="relative z-10 px-6 pb-16">
                <div className="max-w-5xl mx-auto">
                    <Link href={`/blog/${featured.slug}`} className="group block">
                        <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${featured.coverGradient} p-px`}>
                            <div className="relative rounded-[23px] overflow-hidden bg-[#0f0f11]">
                                {/* Gradient header area */}
                                <div className={`h-48 sm:h-64 bg-gradient-to-br ${featured.coverGradient} flex items-center justify-center relative overflow-hidden`}>
                                    <span className="text-7xl sm:text-8xl opacity-80 select-none">{featured.coverEmoji}</span>
                                    {/* shimmer overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] via-transparent to-transparent" />
                                    {/* FEATURED badge */}
                                    <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                        Featured
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 sm:p-8">
                                    <div className="flex flex-wrap items-center gap-3 mb-4">
                                        <span className="bg-green-500/20 text-green-300 text-xs font-bold px-3 py-1 rounded-full">
                                            {featured.category}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-white/30 font-medium">
                                            <Clock className="w-3 h-3" />
                                            {featured.readingTime} min read
                                        </span>
                                        <span className="text-xs text-white/30">{formatDate(featured.publishedAt)}</span>
                                    </div>

                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3 group-hover:text-green-300 transition-colors">
                                        {featured.title}
                                    </h2>
                                    <p className="text-white/50 leading-relaxed mb-6 max-w-2xl">
                                        {featured.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xs font-black">
                                                {featured.author.avatar}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white/80">{featured.author.name}</p>
                                                <p className="text-xs text-white/30">{featured.author.role}</p>
                                            </div>
                                        </div>
                                        <span className="flex items-center gap-1.5 text-sm font-bold text-green-400 group-hover:gap-3 transition-all">
                                            Read article <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </section>

            {/* ─── Post grid ───────────────────────────────────────── */}
            <section className="relative z-10 px-6 pb-32">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-8 border-b border-white/5 pb-4">
                        All Posts
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {rest.map((post) => (
                            <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                                <article className="h-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 hover:border-white/15 rounded-2xl overflow-hidden transition-all duration-300">
                                    {/* Cover strip */}
                                    <div className={`h-28 bg-gradient-to-br ${post.coverGradient} flex items-center justify-center relative`}>
                                        <span className="text-5xl opacity-70 select-none">{post.coverEmoji}</span>
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b]/60 to-transparent" />
                                    </div>

                                    {/* Body */}
                                    <div className="p-5">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            <span className="bg-white/8 text-white/60 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                {post.category}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] text-white/25 font-medium">
                                                <Clock className="w-2.5 h-2.5" />{post.readingTime} min
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-black tracking-tight mb-2 group-hover:text-green-300 transition-colors leading-snug">
                                            {post.title}
                                        </h3>
                                        <p className="text-white/40 text-sm leading-relaxed line-clamp-3 mb-4">
                                            {post.excerpt}
                                        </p>

                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-[9px] font-black">
                                                    {post.author.avatar}
                                                </div>
                                                <span className="text-xs font-bold text-white/40">{post.author.name}</span>
                                            </div>
                                            <span className="text-xs text-white/25">{formatDate(post.publishedAt)}</span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA strip ───────────────────────────────────────── */}
            <section className="relative z-10 px-6 pb-20">
                <div className="max-w-5xl mx-auto">
                    <div className="bg-gradient-to-r from-green-600/20 via-yellow-600/10 to-transparent border border-green-500/20 rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-2xl font-black mb-2">Ready to put this into practice?</h3>
                            <p className="text-white/50">Create your first event in under two minutes.</p>
                        </div>
                        <Link
                            href="/events/create"
                            className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:shadow-green-500/30 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                        >
                            Create an event
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
