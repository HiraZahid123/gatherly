"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAllBlogPosts, formatDate } from "@/lib/blog-data";

export default function BlogSection() {
    const blogs = getAllBlogPosts().slice(0, 3);

    return (
        <section className="py-24 bg-white">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black mb-4 text-gray-900">
                            From our blog
                        </h2>
                        <p className="text-gray-600 text-lg">
                            Tips, tricks, and inspiration for your next event.
                        </p>
                    </div>
                    <Link href="/blog" className="flex items-center gap-2 text-green-600 font-bold hover:text-green-700 transition-colors">
                        View all posts <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {blogs.map((blog) => (
                        <Link href={`/blog/${blog.slug}`} key={blog.slug} className="group block">
                            <div className={`aspect-[4/3] rounded-3xl overflow-hidden relative mb-6 bg-gradient-to-br ${blog.coverGradient} flex items-center justify-center p-px`}>
                                <div className="absolute inset-[1px] rounded-[23px] bg-gradient-to-br from-white/10 to-transparent z-0"></div>
                                <span className="text-8xl opacity-80 select-none group-hover:scale-110 transition-transform duration-500 z-10">{blog.coverEmoji}</span>
                                <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm border border-white/20 z-10">
                                    {blog.category}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 mb-3 font-medium">
                                <span>{formatDate(blog.publishedAt)}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{blog.readingTime} min read</span>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors line-clamp-2">
                                {blog.title}
                            </h3>
                            <p className="text-gray-600 line-clamp-3">
                                {blog.excerpt}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
