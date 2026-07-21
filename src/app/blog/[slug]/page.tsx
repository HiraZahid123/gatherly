import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostFromDB, getAllBlogPostsFromDB, formatDate } from "@/lib/blog-data";
import { ArrowLeft, Clock, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
    const posts = await getAllBlogPostsFromDB();
    return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostFromDB(slug);
    if (!post) return { title: "Post not found" };
    return {
        title: `${post.title} — Gatherly Blog`,
        description: post.excerpt,
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const post = await getBlogPostFromDB(slug);
    if (!post) notFound();

    const allPosts = await getAllBlogPostsFromDB();
    const currentIndex = allPosts.findIndex((p) => p.slug === slug);
    const prev = allPosts[currentIndex + 1] ?? null;
    const next = allPosts[currentIndex - 1] ?? null;

    return (
        <div className="min-h-screen bg-[#0a0a0b] text-white">
            {/* Ambient */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-900/15 blur-[140px] rounded-full" />
                <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full" />
            </div>

            {/* ─── Hero / Cover ─────────────────────────────────── */}
            <div className={`relative z-10 w-full pt-24 pb-0 bg-gradient-to-b ${post.coverGradient} overflow-hidden`}>
                {/* Bottom fade to page bg */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0b]" />

                <div className="relative max-w-3xl mx-auto px-6 pt-12 pb-24 text-center">
                    {/* Back link */}
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-bold mb-10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blog
                    </Link>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                        <span className="bg-white/15 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                            {post.category}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-white/60 font-medium">
                            <Clock className="w-3 h-3" />
                            {post.readingTime} min read
                        </span>
                        <span className="text-xs text-white/60">{formatDate(post.publishedAt)}</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-6">
                        {post.title}
                    </h1>
                    <p className="text-white/70 text-lg leading-relaxed max-w-xl mx-auto mb-8">
                        {post.excerpt}
                    </p>

                    {/* Author */}
                    <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xs font-black shrink-0">
                            {post.author.avatar}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold leading-tight">{post.author.name}</p>
                            <p className="text-xs text-white/50">{post.author.role}</p>
                        </div>
                    </div>

                    {/* Big emoji */}
                    <div className="mt-10 text-8xl opacity-30 select-none">{post.coverEmoji}</div>
                </div>
            </div>

            {/* ─── Article body ─────────────────────────────────── */}
            <article className="relative z-10 max-w-2xl mx-auto px-6 py-16">
                <div
                    className="prose-blog"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </article>

            {/* ─── Post navigation ──────────────────────────────── */}
            {(prev || next) && (
                <nav className="relative z-10 max-w-2xl mx-auto px-6 pb-20">
                    <div className="border-t border-white/8 pt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {prev ? (
                            <Link
                                href={`/blog/${prev.slug}`}
                                className="group flex flex-col gap-1 bg-white/[0.03] hover:bg-white/[0.07] border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all"
                            >
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">
                                    <ArrowLeft className="w-3 h-3" /> Previous
                                </span>
                                <span className="font-bold text-sm text-white/70 group-hover:text-white transition-colors leading-snug">
                                    {prev.title}
                                </span>
                            </Link>
                        ) : <div />}
                        {next && (
                            <Link
                                href={`/blog/${next.slug}`}
                                className="group flex flex-col gap-1 bg-white/[0.03] hover:bg-white/[0.07] border border-white/8 hover:border-white/15 rounded-2xl p-5 transition-all sm:text-right"
                            >
                                <span className="flex items-center gap-1.5 justify-start sm:justify-end text-[10px] font-black uppercase tracking-widest text-white/25 mb-1">
                                    Next <ArrowRight className="w-3 h-3" />
                                </span>
                                <span className="font-bold text-sm text-white/70 group-hover:text-white transition-colors leading-snug">
                                    {next.title}
                                </span>
                            </Link>
                        )}
                    </div>
                </nav>
            )}

            {/* ─── CTA ──────────────────────────────────────────── */}
            <section className="relative z-10 px-6 pb-24">
                <div className="max-w-2xl mx-auto bg-gradient-to-r from-green-600/20 via-yellow-600/10 to-transparent border border-green-500/20 rounded-3xl p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-green-400 mb-1">Try Gatherly free</p>
                        <h3 className="text-xl font-black">Create your first event today</h3>
                    </div>
                    <Link
                        href="/events/create"
                        className="shrink-0 flex items-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold px-5 py-2.5 rounded-full shadow-lg hover:shadow-green-500/30 transition-all hover:-translate-y-0.5 text-sm whitespace-nowrap"
                    >
                        Get started <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </section>

            {/* Prose styles — scoped via a style tag to avoid global pollution */}
            <style>{`
                .prose-blog { color: rgba(255,255,255,0.75); font-size: 1.0625rem; line-height: 1.8; }
                .prose-blog p { margin-bottom: 1.5rem; }
                .prose-blog h2 { font-size: 1.5rem; font-weight: 900; letter-spacing: -0.02em; color: #fff; margin-top: 2.5rem; margin-bottom: 1rem; line-height: 1.2; }
                .prose-blog h3 { font-size: 1.2rem; font-weight: 800; color: #fff; margin-top: 2rem; margin-bottom: 0.75rem; }
                .prose-blog strong { color: #fff; font-weight: 800; }
                .prose-blog em { color: rgba(255,255,255,0.9); font-style: italic; }
                .prose-blog blockquote { border-left: 3px solid rgba(139,92,246,0.6); padding: 1rem 1.25rem; margin: 2rem 0; background: rgba(139,92,246,0.08); border-radius: 0 12px 12px 0; }
                .prose-blog blockquote p { margin: 0; color: rgba(255,255,255,0.85); font-size: 1.1rem; font-weight: 600; font-style: italic; }
                .prose-blog ul { list-style: none; padding: 0; margin-bottom: 1.5rem; }
                .prose-blog ul li { padding: 0.4rem 0 0.4rem 1.5rem; position: relative; color: rgba(255,255,255,0.7); }
                .prose-blog ul li::before { content: ""; position: absolute; left: 0; top: 0.9rem; width: 6px; height: 6px; border-radius: 50%; background: linear-gradient(to right, #9333ea, #7c3aed); }
                .prose-blog ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 1.5rem; }
                .prose-blog ol li { padding: 0.3rem 0; color: rgba(255,255,255,0.7); }
                .prose-blog a { color: #a78bfa; text-decoration: underline; text-underline-offset: 3px; }
            `}</style>
        </div>
    );
}
