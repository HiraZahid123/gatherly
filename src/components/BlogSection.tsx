"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function BlogSection() {
    const blogs = [
        {
            title: "10 Tips for Hosting the Perfect Birthday Bash",
            excerpt: "Learn how to throw an unforgettable party without stressing yourself out. From invites to decor, we've got you covered.",
            image: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&q=80",
            category: "Hosting",
            date: "Apr 12, 2026"
        },
        {
            title: "The Ultimate Guide to Digital Invitations",
            excerpt: "Why digital invites are taking over and how to design one that gets everyone to RSVP 'Yes' immediately.",
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
            category: "Design",
            date: "Mar 28, 2026"
        },
        {
            title: "Navigating Event Budgets in 2026",
            excerpt: "A comprehensive breakdown of where to spend and where to save when organizing your next big get-together.",
            image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
            category: "Planning",
            date: "Mar 15, 2026"
        }
    ];

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
                    {blogs.map((blog, i) => (
                        <Link href="#" key={i} className="group block">
                            <div className="aspect-[4/3] rounded-3xl overflow-hidden relative mb-6">
                                <Image 
                                    src={blog.image} 
                                    alt={blog.title} 
                                    fill 
                                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-sm">
                                    {blog.category}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <span>{blog.date}</span>
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
