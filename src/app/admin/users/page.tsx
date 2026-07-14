"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
    Users as UsersIcon,
    Search,
    User as UserIcon,
    Mail,
    Phone,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Edit3,
    X,
    Loader2,
    Check,
    ShieldOff,
    Shield,
    ChevronRight as ArrowRight,
    Calendar,
    MessageSquare,
    Ban,
    AlertTriangle,
    ExternalLink,
    CheckSquare,
    Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const ROLES = ["GUEST", "HOST", "STAFF", "ADMIN"] as const;
const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-green-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]",
    HOST: "bg-emerald-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    STAFF: "bg-amber-500 text-white",
    GUEST: "bg-white/5 text-white/40"
};

export default function UsersManagement() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Drawer state
    const [drawerUser, setDrawerUser] = useState<any>(null);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [drawerTab, setDrawerTab] = useState<"profile" | "events" | "rsvps" | "comments">("profile");

    // Create state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", role: "GUEST", password: "" });
    const [isCreating, setIsCreating] = useState(false);

    // Edit state
    const [editingUser, setEditingUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "GUEST" });
    const [isUpdating, setIsUpdating] = useState(false);

    // Suspension state
    const [suspendModal, setSuspendModal] = useState<{ user: any; open: boolean }>({ user: null, open: false });
    const [suspendReason, setSuspendReason] = useState("");
    const [isSuspending, setIsSuspending] = useState(false);

    // Bulk action state
    const [bulkRole, setBulkRole] = useState("GUEST");
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?page=${page}&search=${search}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.users);
                setPagination(data.pagination);
            }
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => {
        const timer = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const openDrawer = async (user: any) => {
        setDrawerTab("profile");
        setDrawerUser({ ...user }); // show basic info immediately
        setDrawerLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${user.id}`);
            const data = await res.json();
            if (data.success) setDrawerUser(data.user);
        } finally {
            setDrawerLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createForm)
            });
            const data = await res.json();
            if (res.ok) {
                setIsCreateModalOpen(false);
                setCreateForm({ name: "", email: "", phone: "", role: "GUEST", password: "" });
                fetchUsers();
            } else {
                alert(data.message || "Failed to create user");
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: editingUser.id, ...editForm })
            });
            if (res.ok) { setEditingUser(null); fetchUsers(); }
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, role: newRole })
        });
        fetchUsers();
    };

    const handleDeleteUser = async (userId: string, name?: string) => {
        if (!confirm(`Permanently delete ${name || "this user"}? This cannot be undone.`)) return;
        const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            fetchUsers();
            if (drawerUser?.id === userId) setDrawerUser(null);
        } else alert(data.message);
    };

    const handleSuspend = async () => {
        if (!suspendModal.user) return;
        setIsSuspending(true);
        try {
            await fetch(`/api/admin/users/${suspendModal.user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "suspend", reason: suspendReason })
            });
            setSuspendModal({ user: null, open: false });
            setSuspendReason("");
            fetchUsers();
            if (drawerUser?.id === suspendModal.user.id) openDrawer(suspendModal.user);
        } finally {
            setIsSuspending(false);
        }
    };

    const handleUnsuspend = async (userId: string) => {
        await fetch(`/api/admin/users/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "unsuspend" })
        });
        fetchUsers();
        if (drawerUser?.id === userId) openDrawer({ id: userId });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === users.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(users.map(u => u.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Delete ${selectedIds.size} users permanently?`)) return;
        const ids = Array.from(selectedIds);
        for (const id of ids) {
            await fetch(`/api/admin/users?userId=${id}`, { method: "DELETE" });
        }
        setSelectedIds(new Set());
        fetchUsers();
    };

    const handleBulkRoleChange = async () => {
        setIsBulkUpdating(true);
        try {
            await fetch("/api/admin/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIds: Array.from(selectedIds), role: bulkRole })
            });
            setSelectedIds(new Set());
            fetchUsers();
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const allSelected = users.length > 0 && selectedIds.size === users.length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase text-white">User Registry</h1>
                        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                            {pagination?.total || 0} platform members
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-12 px-6 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-2"
                    >
                        <UserIcon className="w-4 h-4" />
                        Add User
                    </button>
                </div>
                <div className="relative group max-w-sm w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full h-14 bg-[#0a0a0b] border border-white/5 rounded-2xl pl-14 pr-6 outline-none focus:border-white/20 text-sm font-medium transition-all text-white"
                    />
                </div>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-wrap items-center gap-4"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                            {selectedIds.size} selected
                        </span>
                        <div className="flex items-center gap-2 ml-auto flex-wrap">
                            <select
                                title="Select Role for Bulk Update"
                                value={bulkRole}
                                onChange={e => setBulkRole(e.target.value)}
                                className="h-9 bg-[#0a0a0b] border border-white/10 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest text-white/60 outline-none"
                            >
                                {ROLES.map(r => <option key={r} value={r} className="bg-[#1a1a1a]">{r}</option>)}
                            </select>
                            <button
                                onClick={handleBulkRoleChange}
                                disabled={isBulkUpdating}
                                className="h-9 px-4 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                {isBulkUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                                Set Role
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="h-9 px-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                <Trash2 className="w-3 h-3" />
                                Delete All
                            </button>
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                title="Clear Selection"
                                className="h-9 w-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all text-white/40"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table */}
            <div className="bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="px-6 py-6 w-12">
                                    <button
                                        title="Select All"
                                        onClick={toggleSelectAll}
                                        className="text-white/20 hover:text-white/60 transition-colors"
                                    >
                                        {allSelected ? <CheckSquare className="w-4 h-4 text-green-400" /> : <Square className="w-4 h-4" />}
                                    </button>
                                </th>
                                <th className="px-4 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">User</th>
                                <th className="px-4 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Contact</th>
                                <th className="px-4 py-6 text-center text-[10px] font-black uppercase tracking-widest text-white/20">Role</th>
                                <th className="px-4 py-6 text-left text-[10px] font-black uppercase tracking-widest text-white/20">Activity</th>
                                <th className="px-4 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {loading && users.length === 0 ? (
                                [1, 2, 3, 4].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-10 h-20 bg-white/[0.01]" />
                                    </tr>
                                ))
                            ) : users.map((user) => (
                                <tr
                                    key={user.id}
                                    className={`transition-colors hover:bg-white/[0.02] group ${selectedIds.has(user.id) ? "bg-green-500/5" : ""} ${user.suspendedAt ? "opacity-60" : ""}`}
                                >
                                    <td className="px-6 py-5">
                                        <button title="Select Row" onClick={() => toggleSelect(user.id)} className="text-white/20 hover:text-white/60 transition-colors">
                                            {selectedIds.has(user.id) ? <CheckSquare className="w-4 h-4 text-green-400" /> : <Square className="w-4 h-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-xs font-black ring-1 ring-white/10 flex-shrink-0 overflow-hidden relative">
                                                {user.image ? (
                                                    <Image src={user.image} alt="" fill className="object-cover" />
                                                ) : (
                                                    user.name?.charAt(0) || "U"
                                                )}
                                                {user.suspendedAt && (
                                                    <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                                                        <Ban className="w-3 h-3 text-red-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-white">{user.name || "Anonymous"}</span>
                                                    {user.suspendedAt && (
                                                        <span className="text-[8px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md">Suspended</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] font-mono text-white/20 truncate max-w-[100px]">{user.id.slice(0, 8)}…</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-white/60">
                                                <Mail className="w-3 h-3 opacity-40 flex-shrink-0" />
                                                <span className="text-xs font-medium truncate max-w-[160px]">{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-2 text-white/30">
                                                    <Phone className="w-3 h-3 opacity-40 flex-shrink-0" />
                                                    <span className="text-xs font-medium">{user.phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-center">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                                            title="Update User Role"
                                            className={`text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1.5 border-none outline-none cursor-pointer transition-all ${ROLE_COLORS[user.role]}`}
                                        >
                                            {ROLES.map(r => <option key={r} value={r} className="bg-[#1a1a1a]">{r}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-4 py-5">
                                        {(user.role === 'HOST' || user.role === 'ADMIN') && user.events?.length > 0 ? (
                                            <div className="space-y-1 max-w-[200px]">
                                                {user.events.slice(0, 2).map((ev: any) => (
                                                    <a key={ev.id} href={`/e/${ev.slug}`} target="_blank" title={`View: ${ev.title}`} className="flex items-center gap-1.5 group/ev">
                                                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ev.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-white/20'}`} />
                                                        <span className="text-[10px] font-medium text-white/50 group-hover/ev:text-white/80 truncate transition-colors">{ev.title}</span>
                                                        <span className="text-[9px] text-white/20 flex-shrink-0">{ev._count.rsvps}</span>
                                                    </a>
                                                ))}
                                                {user._count.events > 2 && (
                                                    <span className="text-[9px] text-white/20 uppercase tracking-widest font-black">+{user._count.events - 2} more</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white/90">{user._count?.rsvps ?? 0}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">RSVPs</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white/90">
                                                        {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Joined</span>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-5 text-right">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => openDrawer(user)} title="View Full Profile" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                                                <ArrowRight className="w-4 h-4 text-white/40" />
                                            </button>
                                            <button onClick={() => { setEditingUser(user); setEditForm({ name: user.name || "", email: user.email || "", phone: user.phone || "", role: user.role }); }} title="Edit Profile" className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                                                <Edit3 className="w-4 h-4 text-white/40" />
                                            </button>
                                            {user.suspendedAt ? (
                                                <button onClick={() => handleUnsuspend(user.id)} title="Unsuspend User" className="w-9 h-9 rounded-xl bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center transition-all">
                                                    <Shield className="w-4 h-4 text-green-400" />
                                                </button>
                                            ) : (
                                                <button onClick={() => setSuspendModal({ user, open: true })} title="Suspend User" className="w-9 h-9 rounded-xl bg-amber-500/5 hover:bg-amber-500/20 flex items-center justify-center transition-all">
                                                    <ShieldOff className="w-4 h-4 text-amber-500/50" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDeleteUser(user.id, user.name)} title="Delete User Permanently" className="w-9 h-9 rounded-xl bg-red-500/5 hover:bg-red-500/20 flex items-center justify-center transition-all">
                                                <Trash2 className="w-4 h-4 text-red-500/40" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && users.length === 0 && (
                    <div className="flex flex-col items-center py-20 gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                            <UsersIcon className="w-8 h-8 text-white/10" />
                        </div>
                        <p className="text-sm font-bold text-white/20 uppercase tracking-widest">No users found</p>
                    </div>
                )}

                {pagination && pagination.pages > 1 && (
                    <div className="px-8 py-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Page {page} of {pagination.pages}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} title="Previous Page" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} title="Next Page" className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-20 flex items-center justify-center transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Detail Drawer */}
            <AnimatePresence>
                {drawerUser && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDrawerUser(null)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
                        />
                        <motion.aside
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#080808] border-l border-white/10 z-[95] flex flex-col overflow-hidden"
                        >
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-white/5 flex-shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-1 ring-white/10 flex items-center justify-center text-lg font-black overflow-hidden flex-shrink-0">
                                        {drawerUser.image ? <Image src={drawerUser.image} alt="" fill className="object-cover" /> : (drawerUser.name?.charAt(0) || "U")}
                                        {drawerUser.suspendedAt && <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center"><Ban className="w-4 h-4 text-white" /></div>}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-white leading-tight">{drawerUser.name || "Anonymous"}</h2>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${ROLE_COLORS[drawerUser.role] || "bg-white/5 text-white/40"}`}>{drawerUser.role}</span>
                                    </div>
                                </div>
                                <button onClick={() => setDrawerUser(null)} title="Close Drawer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Suspension Banner */}
                            {drawerUser.suspendedAt && (
                                <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3 flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Account Suspended</p>
                                        <p className="text-xs text-white/40 mt-0.5">{drawerUser.suspendedReason || "No reason provided"}</p>
                                    </div>
                                    <button onClick={() => handleUnsuspend(drawerUser.id)} className="text-[9px] font-black uppercase tracking-widest text-green-400 hover:text-green-300 flex-shrink-0">Restore</button>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex px-6 pt-4 gap-1 border-b border-white/5 flex-shrink-0">
                                {(["profile", "events", "rsvps", "comments"] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setDrawerTab(tab)}
                                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl mb-2 transition-all ${drawerTab === tab ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                                {drawerLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {drawerTab === "profile" && (
                                            <div className="space-y-4">
                                                {[
                                                    { label: "Email", value: drawerUser.email, icon: <Mail className="w-3.5 h-3.5" /> },
                                                    { label: "Phone", value: drawerUser.phone || "Not set", icon: <Phone className="w-3.5 h-3.5" /> },
                                                    { label: "Member Since", value: drawerUser.createdAt ? new Date(drawerUser.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Unknown", icon: <Calendar className="w-3.5 h-3.5" /> },
                                                ].map(({ label, value, icon }) => (
                                                    <div key={label} className="bg-white/5 rounded-2xl p-4 flex items-center gap-4">
                                                        <div className="text-white/20">{icon}</div>
                                                        <div>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/20">{label}</p>
                                                            <p className="text-sm font-medium text-white/80 mt-0.5">{value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="grid grid-cols-3 gap-3">
                                                    {[
                                                        { label: "Events", val: drawerUser._count?.events ?? 0 },
                                                        { label: "RSVPs", val: drawerUser._count?.rsvps ?? 0 },
                                                        { label: "Comments", val: drawerUser._count?.comments ?? 0 },
                                                    ].map(({ label, val }) => (
                                                        <div key={label} className="bg-white/5 rounded-2xl p-4 text-center">
                                                            <p className="text-2xl font-black text-white">{val}</p>
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-1">{label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {drawerTab === "events" && (
                                            <div className="space-y-3">
                                                {drawerUser.events?.length === 0 && (
                                                    <p className="text-sm text-white/20 text-center py-10">No events hosted.</p>
                                                )}
                                                {drawerUser.events?.map((ev: any) => (
                                                    <div key={ev.id} className="bg-white/5 rounded-2xl p-4 space-y-2">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-sm font-bold text-white">{ev.title}</p>
                                                            <a href={`/e/${ev.slug}`} target="_blank" title="Open Event" className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0">
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${ev.status === 'PUBLISHED' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-white/40'}`}>{ev.status}</span>
                                                            <span className="text-[10px] text-white/30">{ev._count?.rsvps ?? 0} RSVPs</span>
                                                            {ev.startDate && <span className="text-[10px] text-white/30">{new Date(ev.startDate).toLocaleDateString()}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {drawerTab === "rsvps" && (
                                            <div className="space-y-3">
                                                {!drawerUser.rsvps || drawerUser.rsvps.length === 0 ? (
                                                    <div className="flex flex-col items-center py-12 gap-3">
                                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                                            <Calendar className="w-6 h-6 text-white/10" />
                                                        </div>
                                                        <p className="text-sm text-white/20 text-center font-bold">No RSVPs found</p>
                                                        <p className="text-[10px] text-white/10 text-center uppercase tracking-widest">This user hasn't registered for any events</p>
                                                    </div>
                                                ) : (
                                                    drawerUser.rsvps.map((rsvp: any) => {
                                                        const statusColor: Record<string, string> = {
                                                            ACCEPTED: "bg-green-500/10 text-green-400 border-green-500/20",
                                                            MAYBE: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                                                            DECLINED: "bg-red-500/10 text-red-400 border-red-500/20",
                                                            PENDING: "bg-white/5 text-white/40 border-white/10",
                                                            WAITLISTED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
                                                            CANCELLED: "bg-white/5 text-white/20 border-white/5",
                                                        };
                                                        return (
                                                            <div key={rsvp.id} className="bg-white/5 rounded-2xl p-4 space-y-3">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-bold text-white leading-snug">{rsvp.event?.title}</p>
                                                                        <p className="text-[10px] text-white/30 mt-0.5">by {rsvp.event?.host?.name || "Unknown host"}</p>
                                                                    </div>
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex-shrink-0 border ${statusColor[rsvp.status] || "bg-white/5 text-white/30 border-white/10"}`}>
                                                                        {rsvp.status}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-3 flex-wrap">
                                                                    {rsvp.event?.startDate && (
                                                                        <div className="flex items-center gap-1.5 text-white/30">
                                                                            <Calendar className="w-3 h-3" />
                                                                            <span className="text-[10px]">{new Date(rsvp.event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                                                                        </div>
                                                                    )}
                                                                    {rsvp.checkedIn && (
                                                                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                                                            <Check className="w-2.5 h-2.5" />
                                                                            Checked In
                                                                        </span>
                                                                    )}
                                                                    <a href={`/e/${rsvp.event?.slug}`} target="_blank" title="View Event" className="ml-auto text-white/20 hover:text-white/60 transition-colors flex-shrink-0">
                                                                        <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}

                                        {drawerTab === "comments" && (
                                            <div className="space-y-3">
                                                {drawerUser.comments?.length === 0 && (
                                                    <p className="text-sm text-white/20 text-center py-10">No comments found.</p>
                                                )}
                                                {drawerUser.comments?.map((c: any) => (
                                                    <div key={c.id} className="bg-white/5 rounded-2xl p-4 space-y-2">
                                                        <p className="text-xs text-white/70 leading-relaxed">"{c.content}"</p>
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="w-3 h-3 text-white/20" />
                                                            <a href={`/e/${c.event?.slug}`} target="_blank" className="text-[10px] text-white/30 hover:text-white/60 transition-colors">{c.event?.title}</a>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="px-8 py-6 border-t border-white/5 flex gap-3 flex-shrink-0">
                                {drawerUser.suspendedAt ? (
                                    <button onClick={() => handleUnsuspend(drawerUser.id)} className="flex-1 h-12 bg-green-500/20 text-green-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-green-500/30 transition-all flex items-center justify-center gap-2">
                                        <Shield className="w-4 h-4" />Restore Account
                                    </button>
                                ) : (
                                    <button onClick={() => setSuspendModal({ user: drawerUser, open: true })} className="flex-1 h-12 bg-amber-500/10 text-amber-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2">
                                        <ShieldOff className="w-4 h-4" />Suspend
                                    </button>
                                )}
                                <button onClick={() => handleDeleteUser(drawerUser.id, drawerUser.name)} className="flex-1 h-12 bg-red-500/10 text-red-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                                    <Trash2 className="w-4 h-4" />Delete
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Suspend Modal */}
            <AnimatePresence>
                {suspendModal.open && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSuspendModal({ user: null, open: false })} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0b] border border-amber-500/20 rounded-[2.5rem] w-full max-w-md p-8 relative z-10 shadow-2xl">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                    <ShieldOff className="w-6 h-6 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white">Suspend Account</h3>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">{suspendModal.user?.name || suspendModal.user?.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2 mb-6">
                                <label htmlFor="suspend-reason" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Reason (shown to user)</label>
                                <textarea
                                    id="suspend-reason"
                                    rows={3}
                                    value={suspendReason}
                                    onChange={e => setSuspendReason(e.target.value)}
                                    placeholder="Violated community guidelines..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-amber-500/30 text-white text-sm font-medium resize-none transition-all"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setSuspendModal({ user: null, open: false })} className="flex-1 h-12 bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                                <button onClick={handleSuspend} disabled={isSuspending} className="flex-[2] h-12 bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSuspending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ShieldOff className="w-4 h-4" />Suspend Now</>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] w-full max-w-lg p-10 relative z-10 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-500" />
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">New Account</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Manual Provisioning</p>
                                </div>
                                <button onClick={() => setIsCreateModalOpen(false)} title="Close" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/40"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCreateUser} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="c-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Full Name</label>
                                        <input id="c-name" type="text" required placeholder="John Doe" value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-white/20 text-white text-sm font-medium transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="c-phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Phone</label>
                                        <input id="c-phone" type="text" placeholder="+1234..." value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-white/20 text-white text-sm font-medium transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="c-email" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Email Address</label>
                                    <input id="c-email" type="email" required placeholder="john@example.com" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-white/20 text-white text-sm font-medium transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="c-pass" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Password</label>
                                    <input id="c-pass" type="password" placeholder="••••••••" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-white/20 text-white text-sm font-medium transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Role</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {ROLES.map(r => (
                                            <button key={r} type="button" onClick={() => setCreateForm(p => ({ ...p, role: r })) } className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1 ${createForm.role === r ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"}`}>
                                                {createForm.role === r && <Check className="w-3 h-3" />}{r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-4">
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 h-12 bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                                    <button type="submit" disabled={isCreating} className="flex-[2] h-12 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingUser && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingUser(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] w-full max-w-lg p-10 relative z-10 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Edit Profile</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{editingUser.email}</p>
                                </div>
                                <button onClick={() => setEditingUser(null)} title="Close" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-white/40"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleUpdateUser} className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="e-name" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Full Name</label>
                                    <input id="e-name" type="text" required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-white/20 text-white text-sm font-medium transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="e-email" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Email</label>
                                    <input id="e-email" type="email" required value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-white/20 text-white text-sm font-medium transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="e-phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Phone</label>
                                    <input id="e-phone" type="text" value={editForm.phone} placeholder="Not set" onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="w-full h-12 bg-white/5 border border-white/10 rounded-2xl px-4 outline-none focus:border-white/20 text-white text-sm font-medium transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Role</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {ROLES.map(r => (
                                            <button key={r} type="button" onClick={() => setEditForm(p => ({ ...p, role: r }))} className={`h-10 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1 ${editForm.role === r ? "bg-white text-black border-white" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"}`}>
                                                {editForm.role === r && <Check className="w-3 h-3" />}{r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2 flex gap-4">
                                    <button type="button" onClick={() => setEditingUser(null)} className="flex-1 h-12 bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all">Cancel</button>
                                    <button type="submit" disabled={isUpdating} className="flex-[2] h-12 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                        {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
