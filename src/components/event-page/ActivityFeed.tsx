"use client";

import React, { useState, useEffect, useRef, useMemo, memo } from "react";
import NextImage from "next/image";
import { useSession } from "next-auth/react";
import { Send, Image as ImageIcon, CornerDownRight, X, MoreHorizontal, Edit2, Trash2, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import GifPicker from "@/components/ui/GifPicker";
import { toast } from "sonner";

interface Comment {
    id: string;
    content: string;
    type: string;
    mediaUrl?: string;
    createdAt: string;
    userId: string;
    parentId?: string | null;
    user: { id: string; name: string; image?: string };
    replies?: Comment[];
}

interface RSVPActivity {
    id: string;
    name?: string;
    image?: string;
    status: string;
    type: "rsvp";
    createdAt: string;
    user?: { id: string; name: string; image?: string };
}

interface ActivityFeedProps {
    eventId: string;
    comments: Comment[];
    rsvps: RSVPActivity[];
    onPostComment: (content: string, type?: "TEXT" | "GIF" | "STICKER", mediaUrl?: string, parentId?: string) => Promise<void>;
    onEditComment?: (commentId: string, content: string) => Promise<void>;
    onDeleteComment?: (commentId: string) => Promise<void>;
    isHost?: boolean;
    primaryColor?: string;
}

export default function ActivityFeed({
    eventId,
    comments,
    rsvps,
    onPostComment,
    onEditComment,
    onDeleteComment,
    isHost = false,
    primaryColor = "#7c3aed",
}: ActivityFeedProps) {
    const { data: session } = useSession();
    const [newComment, setNewComment] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isPostingReply, setIsPostingReply] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [gifPickerTarget, setGifPickerTarget] = useState<"main" | string>("main");
    const pickerRef = useRef<HTMLDivElement>(null);
    const replyInputRef = useRef<HTMLInputElement>(null);
    const replyPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (replyingTo) {
            setTimeout(() => replyInputRef.current?.focus(), 100);
        }
    }, [replyingTo]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowGifPicker(false);
            }
            if (replyPickerRef.current && !replyPickerRef.current.contains(e.target as Node)) {
                if (gifPickerTarget !== "main") setGifPickerTarget("main");
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [gifPickerTarget]);

    const topLevelComments = useMemo(() => comments.filter(c => !c.parentId), [comments]);
    const activities: ((Comment & { itemType: "comment" }) | (RSVPActivity & { itemType: "rsvp" }))[] = useMemo(() => [
        ...topLevelComments.map(c => ({ ...c, itemType: "comment" as const })),
        ...rsvps.map(r => ({ ...r, itemType: "rsvp" as const })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [topLevelComments, rsvps]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newComment.trim() || isPosting) return;
        setIsPosting(true);
        await onPostComment(newComment, "TEXT");
        setNewComment("");
        setIsPosting(false);
    };

    const handleMediaSelect = async (url: string, type: "GIF" | "STICKER") => {
        if (gifPickerTarget === "main") {
            setIsPosting(true);
            setShowGifPicker(false);
            await onPostComment(type === "GIF" ? "Sent a GIF" : "Sent a sticker", type, url);
            setIsPosting(false);
        } else {
            // reply GIF
            setIsPostingReply(true);
            setGifPickerTarget("main");
            await onPostComment(type === "GIF" ? "Sent a GIF" : "Sent a sticker", type, url, gifPickerTarget);
            setIsPostingReply(false);
            setReplyingTo(null);
        }
    };

    const handleReplySubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!replyText.trim() || isPostingReply || !replyingTo) return;
        setIsPostingReply(true);
        await onPostComment(replyText, "TEXT", undefined, replyingTo.id);
        setReplyText("");
        setIsPostingReply(false);
        setReplyingTo(null);
    };

    const handleEdit = async (commentId: string, content: string) => {
        try {
            if (onEditComment) {
                await onEditComment(commentId, content);
            } else {
                const res = await fetch(`/api/comments/${commentId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content }),
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to edit comment");
                }
            }
            toast.success("Comment updated");
        } catch (e: any) {
            toast.error(e.message || "Failed to update comment");
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            if (onDeleteComment) {
                await onDeleteComment(commentId);
            } else {
                const res = await fetch(`/api/comments/${commentId}`, {
                    method: "DELETE",
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to delete comment");
                }
            }
            toast.success("Comment deleted");
        } catch (e: any) {
            toast.error(e.message || "Failed to delete comment");
        }
    };

    return (
        <div className="max-w-xl mx-auto w-full space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Activity</h3>
                <span className="text-white/40 text-sm font-bold">{activities.length} updates</span>
            </div>

            {/* Main Comment Input */}
            <div className="relative group">
                <div className="absolute left-4 top-4 z-10">
                    <UserAvatar user={session?.user as any} size="sm" />
                </div>
                <form onSubmit={handleSubmit}>
                    <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={session ? "Add a comment..." : "Sign in to comment"}
                        disabled={!session}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-24 py-5 text-white placeholder:text-white/30 focus:bg-white/10 focus:border-white/20 transition-all outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                </form>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="relative" ref={pickerRef}>
                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setGifPickerTarget("main"); setShowGifPicker(!showGifPicker); }}
                            className={`p-2 transition-colors rounded-full ${showGifPicker ? "text-white bg-white/10" : "text-white/40 hover:text-white"}`}
                            disabled={!session}
                        >
                            <ImageIcon className="w-5 h-5" />
                        </motion.button>
                        <AnimatePresence>
                            {showGifPicker && gifPickerTarget === "main" && (
                                <GifPicker
                                    onSelect={handleMediaSelect}
                                    onClose={() => setShowGifPicker(false)}
                                    primaryColor={primaryColor}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                    <AnimatePresence>
                        {newComment.trim() && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                onClick={handleSubmit}
                                disabled={isPosting}
                                className="p-2 rounded-full text-white transition-all disabled:opacity-50 active:scale-90"
                                style={{ background: primaryColor }}
                            >
                                <Send className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Feed */}
            <div className="space-y-2">
                {activities.map((item) => (
                    <motion.div
                        key={`${item.itemType}-${item.id}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    >
                        {item.itemType === "rsvp" ? (
                            <RSVPItem item={item} mounted={mounted} />
                        ) : (
                            <CommentThread
                                comment={item}
                                session={session}
                                mounted={mounted}
                                primaryColor={primaryColor}
                                replyingTo={replyingTo}
                                replyText={replyText}
                                isPostingReply={isPostingReply}
                                gifPickerTarget={gifPickerTarget}
                                replyInputRef={replyInputRef}
                                replyPickerRef={replyPickerRef}
                                onReply={() => setReplyingTo(item.id === replyingTo?.id ? null : item)}
                                onCancelReply={() => setReplyingTo(null)}
                                onReplyTextChange={setReplyText}
                                onReplySubmit={handleReplySubmit}
                                onReplyGifClick={() => {
                                    setGifPickerTarget(item.id);
                                    setShowGifPicker(false);
                                }}
                                onReplyGifSelect={handleMediaSelect}
                                setGifPickerTarget={setGifPickerTarget}
                                onEditComment={handleEdit}
                                onDeleteComment={handleDelete}
                                isHost={isHost}
                            />
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ─── Comment Thread ─────────────────────────────────────────────────────────

function CommentThread({
    comment,
    session,
    mounted,
    primaryColor,
    replyingTo,
    replyText,
    isPostingReply,
    gifPickerTarget,
    replyInputRef,
    replyPickerRef,
    onReply,
    onCancelReply,
    onReplyTextChange,
    onReplySubmit,
    onReplyGifClick,
    onReplyGifSelect,
    setGifPickerTarget,
    onEditComment,
    onDeleteComment,
    isHost = false,
}: {
    comment: Comment & { itemType: "comment" };
    session: any;
    mounted: boolean;
    primaryColor: string;
    replyingTo: Comment | null;
    replyText: string;
    isPostingReply: boolean;
    gifPickerTarget: string;
    replyInputRef: React.RefObject<HTMLInputElement | null>;
    replyPickerRef: React.RefObject<HTMLDivElement | null>;
    onReply: () => void;
    onCancelReply: () => void;
    onReplyTextChange: (v: string) => void;
    onReplySubmit: (e?: React.FormEvent) => void;
    onReplyGifClick: () => void;
    onReplyGifSelect: (url: string, type: "GIF" | "STICKER") => void;
    setGifPickerTarget: (v: string) => void;
    onEditComment: (commentId: string, content: string) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
    isHost?: boolean;
}) {
    const isReplying = replyingTo?.id === comment.id;
    const replies = comment.replies || [];

    return (
        <div className="space-y-1">
            <CommentBubble
                comment={comment}
                session={session}
                mounted={mounted}
                primaryColor={primaryColor}
                isTopLevel
                onReply={session ? onReply : undefined}
                isReplying={isReplying}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                isHost={isHost}
            />

            {/* Replies */}
            <AnimatePresence>
                {replies.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="ml-14 space-y-1 border-l-2 pl-4 mt-1"
                        style={{ borderColor: `${primaryColor}30` }}
                    >
                        {replies.map((reply, i) => (
                            <motion.div
                                key={reply.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, type: "spring", stiffness: 350, damping: 28 }}
                            >
                                <CommentBubble
                                    comment={reply}
                                    session={session}
                                    mounted={mounted}
                                    primaryColor={primaryColor}
                                    isTopLevel={false}
                                    onEditComment={onEditComment}
                                    onDeleteComment={onDeleteComment}
                                    isHost={isHost}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reply Input */}
            <AnimatePresence>
                {isReplying && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -8 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="ml-14 overflow-hidden"
                    >
                        <div className="relative flex items-center gap-2 pt-2">
                            <div
                                className="absolute left-[-1rem] top-0 bottom-4 w-0.5 rounded-full"
                                style={{ background: `${primaryColor}40` }}
                            />
                            <CornerDownRight className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                            <div className="flex-1 relative">
                                <form onSubmit={onReplySubmit} className="flex items-center gap-2">
                                    <input
                                        ref={replyInputRef}
                                        value={replyText}
                                        onChange={e => onReplyTextChange(e.target.value)}
                                        placeholder={`Reply to ${comment.user?.name?.split(" ")[0] || "comment"}...`}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl pl-4 pr-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:bg-white/10 focus:border-white/20 outline-none transition-all"
                                        style={{ borderColor: `${primaryColor}30` }}
                                    />
                                    {/* Reply GIF */}
                                    <div className="relative flex-shrink-0" ref={replyPickerRef}>
                                        <motion.button
                                            type="button"
                                            whileTap={{ scale: 0.9 }}
                                            onClick={onReplyGifClick}
                                            className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                        </motion.button>
                                        <AnimatePresence>
                                            {gifPickerTarget === comment.id && (
                                                <GifPicker
                                                    onSelect={onReplyGifSelect}
                                                    onClose={() => setGifPickerTarget("main")}
                                                    primaryColor={primaryColor}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <AnimatePresence>
                                        {replyText.trim() && (
                                            <motion.button
                                                initial={{ scale: 0, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0, opacity: 0 }}
                                                type="submit"
                                                disabled={isPostingReply}
                                                className="p-1.5 rounded-lg text-white disabled:opacity-50 flex-shrink-0"
                                                style={{ background: primaryColor }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </form>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onCancelReply}
                                className="p-1 rounded-full text-white/20 hover:text-white/60 transition-colors flex-shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Comment Bubble ──────────────────────────────────────────────────────────

const CommentBubble = memo(function CommentBubble({
    comment,
    session,
    mounted,
    primaryColor,
    isTopLevel,
    onReply,
    isReplying,
    onEditComment,
    onDeleteComment,
    isHost = false,
}: {
    comment: Comment;
    session: any;
    mounted: boolean;
    primaryColor: string;
    isTopLevel: boolean;
    onReply?: () => void;
    isReplying?: boolean;
    onEditComment: (commentId: string, content: string) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
    isHost?: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = Boolean(
        (session?.user?.id && comment.userId && session.user.id === comment.userId) ||
        (session?.user?.id && comment.user?.id && session.user.id === comment.user.id) ||
        (session?.user?.email && (comment.user as any)?.email && session.user.email === (comment.user as any).email)
    );
    const canEdit = isAuthor && (comment.type === "TEXT" || comment.type === "comment");
    const canDelete = isAuthor || isHost;

    const handleSaveEdit = async () => {
        if (!editContent.trim() || isSaving) return;
        setIsSaving(true);
        try {
            await onEditComment(comment.id, editContent.trim());
            setIsEditing(false);
        } catch {
            // Error notification is handled in ActivityFeed
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = async () => {
        if (isDeleting) return;
        if (!window.confirm("Are you sure you want to delete this comment?")) return;
        setIsDeleting(true);
        try {
            await onDeleteComment(comment.id);
        } catch {
            // Error handled in ActivityFeed
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex gap-3 group/comment relative">
            <div className="flex-shrink-0 mt-1">
                <UserAvatar user={comment.user} size={isTopLevel ? "md" : "sm"} />
            </div>

            <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-white ${isTopLevel ? "text-sm" : "text-xs"}`}>
                        {comment.user?.name || "Someone"}
                    </span>
                    <span className="text-white/25 text-[11px]">
                        {mounted ? timeAgo(new Date(comment.createdAt)) : "…"}
                    </span>
                </div>

                {/* Content or Edit Form */}
                {isEditing ? (
                    <div className="mt-1 space-y-2 max-w-full">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveEdit();
                                    if (e.key === "Escape") {
                                        setIsEditing(false);
                                        setEditContent(comment.content);
                                    }
                                }}
                                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={handleSaveEdit}
                                disabled={isSaving || !editContent.trim()}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 flex items-center gap-1 transition-colors"
                            >
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(comment.content);
                                }}
                                disabled={isSaving}
                                className="p-1.5 rounded-lg text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {comment.type === "TEXT" || comment.type === "comment" ? (
                            <div
                                className="inline-block rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-white/90 text-sm leading-relaxed border border-white/5 max-w-full"
                                style={{ background: "rgba(255,255,255,0.05)" }}
                            >
                                {comment.content}
                            </div>
                        ) : (comment.type === "GIF" || comment.type === "STICKER") && comment.mediaUrl ? (
                            <div className="rounded-2xl rounded-tl-sm overflow-hidden inline-block max-w-[180px] shadow-lg border border-white/10">
                                <img src={comment.mediaUrl} alt={comment.type} className="w-full h-auto" loading="lazy" decoding="async" />
                            </div>
                        ) : null}
                    </>
                )}

                {/* Actions row: Reply, Edit, Delete */}
                <div className="flex items-center gap-3 pt-1">
                    {isTopLevel && onReply && (
                        <motion.button
                            onClick={onReply}
                            className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover/comment:opacity-100 transition-all duration-200 text-[11px] font-bold"
                            style={{ color: isReplying ? primaryColor : "rgba(255,255,255,0.4)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <CornerDownRight className="w-3 h-3" />
                            {isReplying ? "Replying" : "Reply"}
                        </motion.button>
                    )}

                    {canEdit && !isEditing && (
                        <button
                            type="button"
                            onClick={() => {
                                setEditContent(comment.content);
                                setIsEditing(true);
                            }}
                            className="flex items-center gap-1 text-[11px] font-semibold text-white/40 hover:text-white opacity-80 sm:opacity-0 sm:group-hover/comment:opacity-100 transition-all duration-200"
                            title="Edit comment"
                        >
                            <Edit2 className="w-3 h-3" />
                            Edit
                        </button>
                    )}

                    {canDelete && !isEditing && (
                        <button
                            type="button"
                            onClick={handleDeleteClick}
                            disabled={isDeleting}
                            className="flex items-center gap-1 text-[11px] font-semibold text-red-400/60 hover:text-red-400 opacity-80 sm:opacity-0 sm:group-hover/comment:opacity-100 transition-all duration-200 disabled:opacity-30"
                            title="Delete comment"
                        >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

// ─── RSVP Item ───────────────────────────────────────────────────────────────

function RSVPItem({ item, mounted }: { item: RSVPActivity; mounted: boolean }) {
    const img = item.image || item.user?.image;
    const name = item.user?.name || item.name || "Someone";

    return (
        <div className="flex gap-3 py-1">
            <div className="flex-shrink-0 mt-1">
                {img ? (
                    <div className="relative w-10 h-10">
                        <div className="w-10 h-10 rounded-full overflow-hidden relative border border-white/10 bg-white/10">
                            <NextImage src={img} alt={name} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0a0a0b] flex items-center justify-center text-[7px] font-black text-white z-10 ${getStatusColor(item.status)}`}>
                            {getStatusInitial(item.status)}
                        </div>
                    </div>
                ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 ${getStatusColor(item.status)}`}>
                        {getStatusInitial(item.status)}
                    </div>
                )}
            </div>
            <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-sm">{name}</span>
                <span className="text-white/50 text-sm">
                    {item.status === "ACCEPTED" ? "is going" : item.status === "MAYBE" || item.status === "PENDING" ? "might go" : item.status === "DECLINED" ? "can't go" : "updated RSVP"}
                </span>
                <span className="text-white/25 text-xs">• {mounted ? timeAgo(new Date(item.createdAt)) : "…"}</span>
            </div>
        </div>
    );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function UserAvatar({ user, size = "md" }: { user?: { name?: string | null; image?: string | null }; size?: "sm" | "md" }) {
    const dim = size === "sm" ? "w-7 h-7" : "w-9 h-9";
    const text = size === "sm" ? "text-[10px]" : "text-xs";
    if (user?.image) {
        return (
            <div className={`${dim} rounded-full overflow-hidden relative border border-white/10 flex-shrink-0 bg-white/10`}>
                <NextImage src={user.image} alt={user.name || ""} fill className="object-cover" unoptimized referrerPolicy="no-referrer" />
            </div>
        );
    }
    return (
        <div className={`${dim} rounded-full bg-gradient-to-br from-yellow-500/80 to-teal-600/80 flex items-center justify-center text-white font-bold ${text} flex-shrink-0 border border-white/10`}>
            {user?.name?.[0]?.toUpperCase() || "?"}
        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusColor(status: string) {
    if (status === "ACCEPTED") return "bg-green-500 border-green-600";
    if (status === "MAYBE" || status === "PENDING") return "bg-orange-500 border-orange-600";
    if (status === "DECLINED") return "bg-red-500 border-red-600";
    return "bg-gray-500 border-gray-600";
}

function getStatusInitial(status: string) {
    if (status === "ACCEPTED") return "G";
    if (status === "MAYBE" || status === "PENDING") return "M";
    if (status === "DECLINED") return "No";
    return "?";
}

function timeAgo(date: Date) {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    if (s < 2592000) return `${Math.floor(s / 86400)}d`;
    if (s < 31536000) return `${Math.floor(s / 2592000)}mo`;
    return `${Math.floor(s / 31536000)}y`;
}
