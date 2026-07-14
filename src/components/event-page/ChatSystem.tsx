"use client";

import React, { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { useSession } from "next-auth/react";
import { 
    MessageCircle, 
    X, 
    Send, 
    Users, 
    User as UserIcon, 
    ChevronLeft, 
    MoreHorizontal,
    Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { getSocket } from "@/lib/socket";

interface ChatSystemProps {
    eventId: string;
    eventName: string;
    externalRecipient?: any; // To allow opening a DM from guest list
}

export default function ChatSystem({ eventId, eventName, externalRecipient }: ChatSystemProps) {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"group" | "dms">("group");
    const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

    // Handle external recipient selection
    useEffect(() => {
        if (externalRecipient) {
            setSelectedRecipient(externalRecipient);
            setActiveTab("dms");
            setIsOpen(true);
        }
    }, [externalRecipient]);
    const [messages, setMessages] = useState<any[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [eventGuests, setEventGuests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Socket listeners
    useEffect(() => {
        if (!session?.user?.id) return;

        const socket = getSocket();
        if (!socket) return;

        socket.emit("join-event", eventId);
        socket.emit("join-user", session.user.id);

        const handleNewMessage = (message: any) => {
            // If it's a group message and we are in group tab
            if (message.eventId === eventId && activeTab === "group") {
                setMessages((prev) => [...prev, message]);
            } 
            // If it's a DM and we have that conversation open
            else if (!message.eventId && selectedRecipient && 
                    (message.senderId === selectedRecipient.id || message.recipientId === selectedRecipient.id)) {
                setMessages((prev) => [...prev, message]);
            }
            // Update conversations list regardless
            fetchConversations();
        };

        socket.on("new-chat-message", handleNewMessage);

        return () => {
            socket.off("new-chat-message", handleNewMessage);
        };
    }, [session?.user?.id, activeTab, selectedRecipient, eventId]);

    // Fetch messages when tab or recipient changes
    useEffect(() => {
        if (isOpen) {
            if (activeTab === "group") {
                fetchMessages(`/api/chat?eventId=${eventId}`);
            } else if (selectedRecipient) {
                fetchMessages(`/api/chat?recipientId=${selectedRecipient.id}`);
            } else {
                fetchConversations();
                fetchEventGuests();
            }
        }
    }, [isOpen, activeTab, selectedRecipient]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async (url: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) setMessages(data);
        } catch (e) {
            console.error("Failed to fetch messages", e);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/chat/conversations");
            const data = await res.json();
            if (Array.isArray(data)) setConversations(data);
        } catch (e) {
            console.error("Failed to fetch conversations", e);
        }
    };
    
    const fetchEventGuests = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/guests`);
            const data = await res.json();
            if (data.success && Array.isArray(data.guests)) {
                setEventGuests(data.guests.filter((g: any) => g.userId && g.userId !== session?.user?.id));
            }
        } catch (e) {
            console.error("Failed to fetch guests", e);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !session?.user?.id) return;

        const body: any = { content: newMessage };
        if (activeTab === "group") body.eventId = eventId;
        else if (selectedRecipient) body.recipientId = selectedRecipient.id;

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setNewMessage("");
            } else {
                const errData = await res.json();
                console.error("Chat API error:", errData);
                alert(`Failed to send message: ${errData.error || "Unknown error"}`);
            }
        } catch (e) {
            console.error("Failed to send message client-side:", e);
        }
    };

    if (!session) return null;

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="Open Chat"
                    className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-full shadow-2xl hover:bg-emerald-500 transition-all group animate-bounce"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black"></div>
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-48px)] h-[550px] max-h-[calc(100vh-100px)] bg-[#1a1b1e] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {selectedRecipient && activeTab === "dms" ? (
                                    <button onClick={() => setSelectedRecipient(null)} aria-label="Back to Conversations" className="p-1 hover:bg-white/10 rounded-lg">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                                        <MessageCircle className="w-5 h-5 text-emerald-400" />
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-sm">
                                        {selectedRecipient && activeTab === "dms" ? selectedRecipient.name : (activeTab === "group" ? eventName : "Messages")}
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-[10px] text-white/40 font-medium">Live Connection</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} aria-label="Close Chat" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-white/40" />
                            </button>
                        </div>

                        {/* Tabs Navigation (only if not in a specific DM) */}
                        {(!selectedRecipient || activeTab === "group") && (
                            <div className="flex p-1 bg-black/20 m-3 rounded-xl gap-1">
                                <button
                                    onClick={() => { setActiveTab("group"); setSelectedRecipient(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "group" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"}`}
                                >
                                    <Users className="w-4 h-4" />
                                    Event Group
                                </button>
                                <button
                                    onClick={() => setActiveTab("dms")}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === "dms" ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white"}`}
                                >
                                    <UserIcon className="w-4 h-4" />
                                    Private DMs
                                </button>
                            </div>
                        )}

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {activeTab === "dms" && !selectedRecipient ? (
                                /* Conversations List */
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search guests..." 
                                            className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs focus:bg-white/10 outline-none"
                                        />
                                    </div>
                                    
                                    {searchQuery ? (
                                        /* Search Results */
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest px-1">Search Results</p>
                                            {eventGuests.filter(g => (g.guestName || g.name || "").toLowerCase().includes(searchQuery.toLowerCase())).map((guest) => (
                                                <button
                                                    key={guest.userId}
                                                    onClick={() => { setSelectedRecipient({ id: guest.userId, name: guest.guestName || guest.name, image: guest.image }); setSearchQuery(""); }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5"
                                                >
                                                    {guest.image ? (
                                                        <NextImage src={guest.image} width={40} height={40} className="rounded-full border border-white/10" alt="" unoptimized referrerPolicy="no-referrer" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold">
                                                            {(guest.guestName || guest.name)?.[0]}
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-sm">{guest.guestName || guest.name}</span>
                                                </button>
                                            ))}
                                            {eventGuests.filter(g => (g.guestName || g.name || "").toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                                <p className="text-xs text-white/30 text-center py-4">No guests found matching "{searchQuery}"</p>
                                            )}
                                        </div>
                                    ) : (
                                        /* Conversations List */
                                        <>
                                            {conversations.length > 0 && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest px-1">Recent Conversations</p>
                                                    {conversations.map((conv) => (
                                                        <button
                                                            key={conv.user.id}
                                                            onClick={() => setSelectedRecipient(conv.user)}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl transition-all group border border-transparent hover:border-white/5"
                                                        >
                                                            <div className="relative">
                                                                {conv.user.image ? (
                                                                    <NextImage src={conv.user.image} width={48} height={48} className="rounded-full border border-white/10" alt="" unoptimized referrerPolicy="no-referrer" />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-bold">
                                                                        {conv.user.name?.[0]}
                                                                    </div>
                                                                )}
                                                                {!conv.isRead && <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#1a1b1e]"></div>}
                                                            </div>
                                                            <div className="flex-1 text-left overflow-hidden">
                                                                <div className="flex justify-between items-center mb-0.5">
                                                                    <span className="font-bold text-sm truncate">{conv.user.name}</span>
                                                                    <span className="text-[10px] text-white/20">{format(new Date(conv.createdAt), "HH:mm")}</span>
                                                                </div>
                                                                <p className={`text-xs truncate ${conv.isRead ? "text-white/30" : "text-white font-medium"}`}>
                                                                    {conv.lastMessage}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Suggested Guests */}
                                            {eventGuests.length > 0 && (
                                                <div className="space-y-3 mt-6">
                                                    <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest px-1">Event Guests</p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {eventGuests.slice(0, 6).map((guest) => (
                                                            <button
                                                                key={guest.userId}
                                                                onClick={() => setSelectedRecipient({ id: guest.userId, name: guest.guestName || guest.name, image: guest.image })}
                                                                className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl transition-all border border-white/5"
                                                            >
                                                                {guest.image ? (
                                                                    <NextImage src={guest.image} width={32} height={32} className="rounded-full" alt="" unoptimized referrerPolicy="no-referrer" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                                                        {(guest.guestName || guest.name)?.[0]}
                                                                    </div>
                                                                )}
                                                                <span className="text-xs truncate font-bold text-white/60">{(guest.guestName || guest.name)?.split(' ')[0]}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {conversations.length === 0 && eventGuests.length === 0 && (
                                                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-40 py-10">
                                                    <div className="p-4 bg-white/5 rounded-full">
                                                        <UserIcon className="w-8 h-8" />
                                                    </div>
                                                    <p className="text-sm">No other guests found.<br/>Invite some friends!</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* Messages View */
                                <>
                                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                        {messages.map((msg, idx) => {
                                            const isMe = msg.senderId === session.user?.id;
                                            const showAvatar = idx === 0 || messages[idx - 1].senderId !== msg.senderId;

                                            return (
                                                <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                                    {!isMe && (
                                                        <div className="w-8 flex-shrink-0">
                                                            {showAvatar && (
                                                                msg.sender.image ? (
                                                                    <NextImage src={msg.sender.image} width={32} height={32} className="rounded-full border border-white/10" alt="" unoptimized referrerPolicy="no-referrer" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold">
                                                                        {msg.sender.name?.[0]}
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className={`max-w-[80%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                        {!isMe && showAvatar && (
                                                            <span className="text-[10px] text-white/30 font-bold ml-1 mb-1">{msg.sender.name}</span>
                                                        )}
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                                                            isMe 
                                                                ? "bg-emerald-600 text-white rounded-tr-none" 
                                                                : "bg-white/10 text-white/90 rounded-tl-none border border-white/5"
                                                        }`}>
                                                            {msg.content}
                                                        </div>
                                                        <span className="text-[9px] text-white/20 mt-1">
                                                            {format(new Date(msg.createdAt), "HH:mm")}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 bg-white/5 border-t border-white/5">
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <input
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:bg-white/10 outline-none transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!newMessage.trim()}
                                                aria-label="Send Message"
                                                className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:bg-white/10"
                                            >
                                                <Send className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>
        </>
    );
}
