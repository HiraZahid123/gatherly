"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BlogForm from "../../BlogForm";

export default function EditBlogPostPage() {
    const { id } = useParams<{ id: string }>();
    const [post, setPost] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetch(`/api/admin/blog/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    const p = data.post;
                    setPost({
                        ...p,
                        id: p.id,
                        publishedAt: new Date(p.publishedAt).toISOString().slice(0, 16),
                        authorName: p.authorName,
                        authorRole: p.authorRole,
                        authorAvatar: p.authorAvatar,
                    });
                } else {
                    setNotFound(true);
                }
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center py-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
        </div>
    );

    if (notFound) return (
        <div className="text-center py-40">
            <p className="text-white/30 font-bold uppercase tracking-widest text-sm">Post not found</p>
        </div>
    );

    return <BlogForm mode="edit" initialData={post as Parameters<typeof BlogForm>[0]["initialData"]} />;
}
