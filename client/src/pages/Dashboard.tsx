import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SearchIcon, ArrowRightIcon, BarChart3Icon, GlobeIcon, TrendingUpIcon, AlertCircle } from "lucide-react";
import AnalysesCard from "../components/AnalysesCard";
import { useApp } from "../context/AppContext";
import type { Analysis } from "../types/analysis";

export default function Dashboard() {
    const { api, user } = useApp();
    const navigate = useNavigate();
    const [url, setUrl] = useState("");
    const [analyses, setAnalyses] = useState<Analysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalAnalyses, setTotalAnalyses] = useState(0);
    const [error, setError] = useState("");

    const fetchRecent = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const response = await api.get("/api/analysis?page=1&limit=6");
            setAnalyses(response.data.analyses);
            setTotalAnalyses(response.data.total);
            setError("");
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : "Could not load your analyses.");
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [api]);

    const handleAnalyze = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (url.trim()) {
            navigate(`/analyze?url=${encodeURIComponent(url)}`);
        }
    };

    const completedAnalyses = analyses.filter((analysis) => analysis.status === "completed");
    const avgScore = completedAnalyses.length ? Math.round(completedAnalyses.reduce((sum, analysis) => sum + analysis.overallScore, 0) / completedAnalyses.length) : 0;

    const getScoreClass = (s: number) => {
        if (s >= 80) return "score-good";
        if (s >= 50) return "score-medium";
        return "score-poor";
    };

    useEffect(() => {
        (async () => await fetchRecent())();
    }, [fetchRecent]);

    useEffect(() => {
        if (!analyses.some((analysis) => analysis.status === "processing")) return;
        const interval = window.setInterval(() => void fetchRecent(false), 3000);
        return () => window.clearInterval(interval);
    }, [analyses, fetchRecent]);

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-medium text-foreground mb-1">
                        Welcome back, <span className="gradient-text">{user?.name || "there"}</span>
                    </h1>
                    <p className="text-muted-foreground text-sm">Analyze websites and boost your SEO performance.</p>
                </div>

                {/* Quick Analyze */}
                <form onSubmit={handleAnalyze} className="mb-10" style={{ animationDelay: "100ms" }}>
                    <div className="border border-primary/20 rounded-full p-2 flex items-center gap-2 max-w-2xl">
                        <div className="flex items-center gap-3 flex-1 px-3">
                            <SearchIcon size={20} className="text-muted-foreground shrink-0" />
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter a URL to analyze..." className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm py-3" id="dashboard-url-input" />
                        </div>
                        <button type="submit" className="bg-primary px-5 py-3 rounded-full text-primary-foreground text-sm hover:opacity-90 transition-opacity shrink-0 flex items-center gap-2" style={{ color: "var(--background)" }} id="dashboard-analyze-btn">
                            Analyze
                            <ArrowRightIcon size={16} />
                        </button>
                    </div>
                </form>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                    <div className="glass rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <GlobeIcon size={22} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{totalAnalyses}</p>
                            <p className="text-xs text-muted-foreground">Total Audits</p>
                        </div>
                    </div>
                    <div className="glass rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <TrendingUpIcon size={22} />
                        </div>
                        <div>
                            <p className={`text-2xl font-bold ${getScoreClass(avgScore)}`}>{avgScore}</p>
                            <p className="text-xs text-muted-foreground">Recent Avg Score</p>
                        </div>
                    </div>
                    <div className="glass rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <BarChart3Icon size={22} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{user?.analysisCount ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Completed Audits</p>
                        </div>
                    </div>
                </div>

                {/* Recent Analyses */}
                <div style={{ animationDelay: "300ms" }}>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-semibold text-foreground">Recent Analyses</h2>
                        {analyses.length > 0 && (
                            <Link to="/history" className="text-sm text-primary hover:underline flex items-center gap-1">
                                View All <ArrowRightIcon size={14} />
                            </Link>
                        )}
                    </div>

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
                            <SearchIcon size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No analyses yet</h3>
                            <p className="text-sm text-muted-foreground mb-6">Enter a URL above to run your first SEO analysis.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {analyses.map((a) => (
                                <AnalysesCard key={a._id} analysis={a} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
