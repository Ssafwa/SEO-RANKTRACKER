import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Clock, Trash2, ExternalLink, Search, AlertCircle, Loader2, Filter, ArrowUpDown } from "lucide-react";
import ScoreGauge from "../components/ScoreGauge";
import { useApp } from "../context/AppContext";
import type { Analysis } from "../types/analysis";
import toast from "react-hot-toast";

export default function History() {
    const { api } = useApp();
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [error, setError] = useState("");

    const fetchAnalyses = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                search: debouncedSearch,
                status: statusFilter,
                sort: sortBy,
            });
            const response = await api.get(`/api/analysis?${params}`);
            setAnalyses(response.data.analyses);
            setTotalPages(response.data.totalPages || 1);
            setError("");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Could not load analysis history.");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [api, debouncedSearch, page, sortBy, statusFilter]);

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this analysis?")) return;
        setDeleting(id);
        try {
            await api.delete(`/api/analysis/${id}`);
            if (analyses.length === 1 && page > 1) {
                setPage((current) => Math.max(1, current - 1));
            } else {
                await fetchAnalyses();
            }
            toast.success("Analysis deleted.");
        } catch (requestError) {
            toast.error(requestError instanceof Error ? requestError.message : "Could not delete the analysis.");
        } finally {
            setDeleting(null);
        }
    };

    const getScoreClass = (s: number) => {
        if (s >= 80) return "score-good";
        if (s >= 50) return "score-medium";
        return "score-poor";
    };

    useEffect(() => {
        (async () => await fetchAnalyses())();
    }, [fetchAnalyses]);

    useEffect(() => {
        if (!analyses.some((analysis) => analysis.status === "processing")) return;
        const interval = window.setInterval(() => void fetchAnalyses(false), 3000);
        return () => window.clearInterval(interval);
    }, [analyses, fetchAnalyses]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setPage(1);
            setDebouncedSearch(searchQuery);
        }, 250);
        return () => window.clearTimeout(timeout);
    }, [searchQuery]);

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-medium text-foreground">
                            Analysis <span className="gradient-text">History</span>
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">View and manage all your past SEO analyses.</p>
                    </div>
                    <Link to="/analyze" className="bg-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity self-start" style={{ color: "var(--background)" }}>
                        New Analysis
                    </Link>
                </div>

                {/* Filters Row */}
                <div className="mb-6 flex flex-col md:flex-row gap-3" style={{ animationDelay: "100ms" }}>
                    <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 flex-1">
                        <Search size={18} className="text-muted-foreground" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by URL..." className="bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none flex-1" id="history-search-input" />
                    </div>

                    <div className="flex gap-3">
                        <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <Filter size={16} className="text-muted-foreground" />
                            <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} className="bg-transparent text-sm text-foreground outline-none appearance-none pr-4 cursor-pointer">
                                <option value="all" className="bg-background">
                                    All Status
                                </option>
                                <option value="completed" className="bg-background">
                                    Completed
                                </option>
                                <option value="processing" className="bg-background">
                                    Processing
                                </option>
                                <option value="failed" className="bg-background">
                                    Failed
                                </option>
                            </select>
                        </div>
                        <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2">
                            <ArrowUpDown size={16} className="text-muted-foreground" />
                            <select value={sortBy} onChange={(e) => { setPage(1); setSortBy(e.target.value); }} className="bg-transparent text-sm text-foreground outline-none appearance-none pr-4 cursor-pointer">
                                <option value="newest" className="bg-background">
                                    Newest First
                                </option>
                                <option value="oldest" className="bg-background">
                                    Oldest First
                                </option>
                                <option value="score_high" className="bg-background">
                                    Highest Score
                                </option>
                                <option value="score_low" className="bg-background">
                                    Lowest Score
                                </option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* List */}
                {error && (
                    <div role="alert" className="mb-4 rounded-xl severity-warning p-4 text-sm flex items-center gap-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
                {loading ? (
                    <div className="flex items-center justify-center py-30">
                        <div className="size-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : analyses.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Search size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">{searchQuery ? "No matching analyses" : "No analyses yet"}</h3>
                        <p className="text-sm text-muted-foreground">{searchQuery ? "Try a different search term." : "Run your first SEO analysis to see it here."}</p>
                    </div>
                ) : (
                    <div className="space-y-3" style={{ animationDelay: "200ms" }}>
                        {analyses.map((a) => (
                            <div key={a._id} className="glass rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-muted/50 transition-all group">
                                {/* Score */}
                                <div className="shrink-0">
                                    {a.status === "completed" ? (
                                        <ScoreGauge score={a.overallScore} size={52} strokeWidth={4} />
                                    ) : a.status === "processing" ? (
                                        <div className="w-[52px] h-[52px] rounded-full glass flex items-center justify-center">
                                            <Loader2 size={20} className="text-primary animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="w-[52px] h-[52px] rounded-full glass flex items-center justify-center">
                                            <AlertCircle size={20} className="text-danger" />
                                        </div>
                                    )}
                                </div>

                                {/* URL + Meta */}
                                <div className="flex-1 min-w-0">
                                    <Link to={`/report/${a._id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block">
                                        {(() => {
                                            try {
                                                return new URL(a.url).hostname;
                                            } catch {
                                                return a.url;
                                            }
                                        })()}
                                    </Link>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{a.url}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(a.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "completed" ? "bg-success/10 text-success" : a.status === "processing" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"}`}>{a.status}</span>
                                    </div>
                                </div>

                                {/* Category scores */}
                                {a.status === "completed" && (
                                    <div className="hidden lg:grid grid-cols-4 gap-4">
                                        {[
                                            { label: "SEO", value: a.categories.seo },
                                            { label: "Perf", value: a.categories.performance },
                                            { label: "A11y", value: a.categories.accessibility },
                                            { label: "BP", value: a.categories.bestPractices },
                                        ].map((c) => (
                                            <div key={c.label} className="text-center w-12">
                                                <p className={`text-sm font-bold ${getScoreClass(c.value)}`}>{c.value}</p>
                                                <p className="text-[10px] text-muted-foreground">{c.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <Link to={`/report/${a._id}`} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all" title="View Report">
                                        <ExternalLink size={16} />
                                    </Link>
                                    <button onClick={() => handleDelete(a._id)} disabled={deleting === a._id} className="p-2 rounded-lg hover:bg-danger/10 text-muted-foreground hover:text-danger transition-all disabled:opacity-50" title="Delete">
                                        {deleting === a._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl glass text-sm text-foreground disabled:opacity-30 hover:bg-muted/50 transition-all">
                            Previous
                        </button>
                        <span className="px-4 py-2 text-sm text-muted-foreground">
                            Page {page} of {totalPages}
                        </span>
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-xl glass text-sm text-foreground disabled:opacity-30 hover:bg-muted/50 transition-all">
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
