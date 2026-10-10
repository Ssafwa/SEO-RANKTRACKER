import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
    Target, Plus, RefreshCw, Trash2, TrendingUp, TrendingDown, 
    Minus, ExternalLink, Clock, Loader2, X, Search, Globe, 
    AlertCircle, Eye, EyeOff, Filter, ArrowUpDown 
} from "lucide-react";
import { useApp } from "../context/AppContext";
import axios from "axios";
import toast from "react-hot-toast";

interface KeywordItem {
    _id: string;
    keyword: string;
    url: string;
    domain: string;
    currentPosition: number | null;
    currentPage: number | null;
    bestPosition: number | null;
    positionChange: number;
    resultsScanned: number;
    lastError: string;
    status: "pending" | "checking" | "completed" | "failed";
    active: boolean;
    lastChecked: string | null;
    lastCheck?: string | null;
    createdAt?: string;
    competitors: { position: number; url: string; domain: string; title: string; snippet: string }[];
}

export default function RankTracker() {

    const { api } = useApp();

    const [keywords, setKeywords] = useState<KeywordItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newKeyword, setNewKeyword] = useState("");
    const [newUrl, setNewUrl] = useState("");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");
    const [refreshing, setRefreshing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [listError, setListError] = useState("");
    const fetchKeywords = useCallback(async () => {
        try {
            const res = await api.get("/api/rank/list");
            setKeywords(res.data.keywords);
            setListError("");
        } catch (error) {
            setListError(axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Failed to load tracked keywords.");
        } finally {
            setLoading(false);
        }
    }, [api]);

const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newKeyword.trim() || !newUrl.trim()) return;
    setAdding(true);
    setAddError("");
    
    try {
        const res = await api.post('/api/rank/add', { keyword: newKeyword.trim(), url: newUrl.trim() });
        
        if (res.data.success) {
            setKeywords((previous) => [res.data.tracking, ...previous]);
            setShowAddModal(false);
            setNewKeyword("");
            setNewUrl("");
            if (res.data.tracking.status === "failed") {
                toast.error(res.data.tracking.lastError || "The rank check failed.");
            } else {
                toast.success("Keyword tracking created and checked.");
            }
        } else {
            setAddError(res.data.message || "Failed to add tracking.");
        }
    } catch (error) {
        setAddError(axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Failed to add keyword tracking");
    } finally {
        setAdding(false);
    }
};

    const handleRefresh = async (id: string) => {
        setRefreshing(id);
        try {
            const res = await api.post(`/api/rank/${id}/refresh`);
            if (res.data.success) {
                setKeywords((previous) => previous.map((keyword) => keyword._id === id ? res.data.tracking : keyword));
                if (res.data.tracking.status === "failed") {
                    toast.error(res.data.tracking.lastError || "The rank check failed.");
                } else {
                    toast.success("Rank check completed.");
                }
            }
        } catch (error) {
            toast.error(axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Could not refresh the ranking.");
            void fetchKeywords();
        } finally {
            setRefreshing(null);
        }
    };
const handleDelete = async (id: string) => {
        if (!confirm("Delete this keyword tracking?")) return;
        setDeleting(id);
        try {
            const res = await api.delete(`/api/rank/${id}`);
            if (res.data.success) {
                setKeywords(prev => prev.filter(k => k._id !== id));
            }
            toast.success("Keyword tracking deleted.");
        } catch (error) {
            toast.error(axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Could not delete tracking.");
        } finally {
            setDeleting(null);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const res = await api.put(`/api/rank/${id}/toggle`);
            if (res.data.success) {
                setKeywords(prev => prev.map(k => k._id === id ? { ...k, active: res.data.tracking.active } : k));
            }
        } catch (error) {
            toast.error(axios.isAxiosError(error) ? error.response?.data?.message || error.message : "Could not update tracking.");
        }
    };

    // --- DATA PROCESSING PIPELINE ---
    // This now sits AFTER all functions, but BEFORE the return statement
    const safeKeywords = Array.isArray(keywords) ? keywords : [];
    let processedData = [...safeKeywords];

    if (searchQuery) {
        processedData = processedData.filter((k) => 
            k.keyword.toLowerCase().includes(searchQuery.toLowerCase()) || 
            k.domain.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (statusFilter !== "all") {
        processedData = processedData.filter((k) => 
            statusFilter === "active" ? k.active === true : k.active === false
        );
    }

   // ... (Filter logic above)
// Sort Data
    processedData.sort((a, b) => {
        if (sortBy === "newest") {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        } else if (sortBy === "rank_asc") {
            if (a.currentPosition === null) return b.currentPosition === null ? 0 : 1;
            if (b.currentPosition === null) return -1;
            return a.currentPosition - b.currentPosition;
        } else if (sortBy === "rank_desc") {
            if (a.currentPosition === null) return b.currentPosition === null ? 0 : 1;
            if (b.currentPosition === null) return -1;
            return b.currentPosition - a.currentPosition;
        } else if (sortBy === "change") {
            return (b.positionChange || 0) - (a.positionChange || 0);
        }
        return 0;
    });

    // Single consolidated helper functions
    const getPositionBadge = (pos: number | null) => {
        if (pos === null) return { text: "Not ranked", class: "text-muted-foreground bg-muted/50" };
        if (pos <= 3) return { text: `#${pos}`, class: "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30" };
        if (pos <= 10) return { text: `#${pos}`, class: "text-primary bg-primary/15 border border-primary/30" };
        if (pos <= 20) return { text: `#${pos}`, class: "text-accent bg-accent/15 border border-accent/30" };
        return { text: `#${pos}`, class: "text-danger bg-danger/15 border border-danger/30" };
    };

    const getChangeIndicator = (change: number) => {
        if (change > 0) return { icon: <TrendingUp size={14} />, text: `+${change}`, class: "text-emerald-500" };
        if (change < 0) return { icon: <TrendingDown size={14} />, text: `${change}`, class: "text-danger" };
        return { icon: <Minus size={14} />, text: "0", class: "text-muted-foreground" };
    };

    useEffect(() => {
        (async () => await fetchKeywords())();
    }, [fetchKeywords]);

    useEffect(() => {
        if (!keywords.some((keyword) => keyword.lastCheck === "checking")) return;
        const interval = window.setInterval(() => void fetchKeywords(), 3000);
        return () => window.clearInterval(interval);
    }, [fetchKeywords, keywords]);

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-medium text-foreground">
                            <span className="gradient-text">Rank Tracker</span>
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">Active keywords are checked daily. You can refresh a ranking any time.</p>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="bg-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-2 self-start" id="add-keyword-btn" style={{ color: "var(--background)" }}>
                        <Plus size={18} />
                        Track Keyword
                    </button>
                </div>

                {/* Filters Row */}
                <div className="mb-6 flex flex-col md:flex-row gap-3" style={{ animationDelay: "100ms" }}>
                    <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 flex-1">
                        <Search size={18} className="text-muted-foreground" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search keywords or domains..." className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none flex-1" id="rank-search-input" />
                    </div>

                    <div className="flex gap-3">
                        <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <Filter size={16} className="text-muted-foreground" />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-sm text-foreground outline-none appearance-none pr-4 cursor-pointer">
                                <option value="all" className="bg-background">All Status</option>
                                <option value="active" className="bg-background">Active</option>
                                <option value="paused" className="bg-background">Paused</option>
                            </select>
                        </div>
                        <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <ArrowUpDown size={16} className="text-muted-foreground" />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-sm text-foreground outline-none appearance-none pr-4 cursor-pointer">
                                <option value="newest" className="bg-background">Newest First</option>
                                <option value="rank_asc" className="bg-background">Highest Ranked</option>
                                <option value="rank_desc" className="bg-background">Lowest Ranked</option>
                                <option value="change" className="bg-background">Biggest Gain</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Keywords List */}
                {listError && (
                    <div role="alert" className="mb-4 rounded-xl severity-warning p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={18} />
                        {listError}
                    </div>
                )}
                {loading ? (
                    <div className="flex items-center justify-center py-30">
                        <div className="size-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : processedData.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Target size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {safeKeywords.length === 0 ? "No keywords tracked yet" : "No matching keywords"}
                        </h3>
                        {safeKeywords.length > 0 && (
                            <>
                                <p className="text-sm text-muted-foreground mb-4">Try changing your search or status filter.</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                    }}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    Clear filters
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3" style={{ animationDelay: "200ms" }}>
                     {processedData.map((kw) => {
    // 1. Safety check
    if (!kw || !kw._id) return null; 

    // 2. Define helpers inside the map so 'kw' is accessible
    const posBadge = getPositionBadge(kw.currentPosition);
    const change = getChangeIndicator(kw.positionChange);

    // 3. Return the entire component structure here
    return (
        <div key={kw._id} className={`glass rounded-xl p-5 hover:bg-muted/50 transition-all ${!kw.active ? "opacity-50" : ""}`}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                
                {/* Rank badge - Now inside the map */}
                <div className="flex items-center gap-4 lg:w-32 shrink-0">
                    {kw.lastCheck === "checking" ? (
                        <div className="w-16 h-16 rounded-xl glass flex items-center justify-center">
                            <Loader2 size={24} className="text-primary animate-spin" />
                        </div>
                    ) : (
                        <div title={kw.currentPosition === null && kw.status === "completed" ? `Not found in ${kw.resultsScanned || 0} checked results` : undefined} className={`w-16 h-16 rounded-xl flex items-center justify-center text-center font-bold ${kw.currentPosition === null ? "px-1 text-xs" : "text-lg"} ${posBadge.class}`}>
                            {kw.currentPosition !== null ? `#${kw.currentPosition}` : posBadge.text}
                        </div>
                    )}
                                            {kw.lastCheck === "completed" && kw.currentPosition && (
                                                <div className="text-center mt-1">
                                                    <div className={`flex items-center justify-center gap-1 text-sm font-medium ${change.class}`}>
                                                        {change.icon}
                                                        {change.text}
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">change</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <Link to={`/rank/${kw._id}`} className="text-base font-semibold text-foreground hover:text-primary transition-colors block truncate">
                                                "{kw.keyword}"
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Globe size={12} className="text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground truncate">{kw.domain}</span>
                                                {kw.currentPage && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Page {kw.currentPage}</span>}
                                            </div>
                                            {kw.lastChecked && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                    <Clock size={10} />
                                                    Last checked: {new Date(kw.lastChecked).toLocaleString()}
                                                </div>
                                            )}
                                            {kw.status === "failed" && (
                                                <p role="status" className="mt-1 text-xs text-danger">
                                                    {kw.lastError || "The latest rank check failed. Refresh to try again."}
                                                </p>
                                            )}
                                            {kw.status === "completed" && kw.currentPosition === null && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Not found in {kw.resultsScanned || "the"} checked Google results.
                                                </p>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        {kw.lastCheck === "completed" && (
                                            <div className="hidden md:flex items-center gap-5">
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-primary">{kw.bestPosition || "—"}</p>
                                                    <p className="text-[10px] text-muted-foreground">Best</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm font-bold text-accent">{kw.competitors?.length || 0}</p>
                                                    <p className="text-[10px] text-muted-foreground">Competitors</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <Link to={`/rank/${kw._id}`} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all" title="View Details">
                                                <ExternalLink size={16} />
                                            </Link>
                                            <button onClick={() => handleRefresh(kw._id)} disabled={refreshing === kw._id || kw.lastCheck === "checking"} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all disabled:opacity-30" title="Refresh Ranking">
                                                <RefreshCw size={16} className={refreshing === kw._id ? "animate-spin" : ""} />
                                            </button>
                                            <button
                                                onClick={() => handleToggle(kw._id)}
                                                className={`p-2 rounded-lg hover:bg-muted transition-all ${kw.active ? "text-success hover:text-success" : "text-muted-foreground hover:text-foreground"}`}
                                                title={kw.active ? "Pause Tracking" : "Resume Tracking"}
                                            >
                                                {kw.active ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                            <button onClick={() => handleDelete(kw._id)} disabled={deleting === kw._id} className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-all disabled:opacity-50" title="Delete">
                                                {deleting === kw._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-foreground">Track New Keyword</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setAddError("");
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {addError && (
                            <div className="mb-4 px-4 py-3 rounded-xl severity-critical text-sm flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                {addError}
                            </div>
                        )}

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label htmlFor="modal-keyword" className="block text-sm font-medium text-foreground mb-1.5">
                                    Keyword
                                </label>
                                <div className="relative">
                                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        id="modal-keyword"
                                        type="text"
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                        placeholder='e.g., "best seo tools"'
                                        required
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 transition-colors text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="modal-url" className="block text-sm font-medium text-foreground mb-1.5">
                                    Website URL
                                </label>
                                <div className="relative">
                                    <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        id="modal-url"
                                        type="text"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="e.g., example.com"
                                        required
                                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 transition-colors text-sm"
                                    />
                                </div>
                            </div>

                            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-muted-foreground">
                                <p>We search up to five pages of Google results for your domain, check active keywords daily, and let you refresh any time. Paused keywords are skipped.</p>
                            </div>

                            <button type="submit" disabled={adding} className="w-full py-3 rounded-xl bg-primary font-semibold text-sm text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50" style={{ color: "var(--background)" }}>
                                {adding ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <>
                                        <Target size={18} />
                                        Start Tracking
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
