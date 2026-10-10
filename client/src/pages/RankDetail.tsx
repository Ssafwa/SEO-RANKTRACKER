import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Target, Globe, Clock, TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle, ExternalLink, Trophy, Users, Calendar, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

interface RankHistoryEntry {
    date: string;
    position: number | null;
    page: number | null;
    title: string;
    snippet: string;
    resultsScanned?: number;
}

interface Competitor {
    position: number;
    url: string;
    domain: string;
    title: string;
    snippet: string;
}

interface TrackingData {
    _id: string;
    keyword: string;
    url: string;
    domain: string;
    currentPosition: number | null;
    currentPage: number | null;
    bestPosition: number | null;
    positionChange: number;
    rankHistory: RankHistoryEntry[];
    competitors: Competitor[];
    resultsScanned: number;
    lastError: string;
    active: boolean;
    lastChecked: string | null;
    status: string;
    createdAt: string;
}

function RankingChart({ history, domain, status, resultsScanned }: {
    history: RankHistoryEntry[];
    domain: string;
    status: string;
    resultsScanned: number;
}) {
    const checkedHistory = history
        .filter((entry) => Number.isFinite(new Date(entry.date).getTime()))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (checkedHistory.length > 0) {
        const width = 900;
        const height = 330;
        const padding = { top: 24, right: 28, bottom: 54, left: 90 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom - 22;
        const verifiedPositions = checkedHistory
            .map((entry) => entry.position)
            .filter((position): position is number => Number.isFinite(position) && position !== null && position > 0);
        const maxRank = Math.max(11, Math.ceil((verifiedPositions.length ? Math.max(...verifiedPositions) : 10) / 2) * 2 + 1);
        const unrankedPosition = maxRank + 2;
        const x = (index: number) => checkedHistory.length === 1
            ? padding.left + plotWidth / 2
            : padding.left + (plotWidth * index) / (checkedHistory.length - 1);
        const y = (position: number) => padding.top + ((position - 1) / (unrankedPosition - 1)) * plotHeight;
        const rankedSegments: { index: number; position: number }[][] = [];
        for (const [index, entry] of checkedHistory.entries()) {
            if (!Number.isFinite(entry.position) || entry.position === null || entry.position <= 0) continue;
            const segment = rankedSegments.at(-1);
            if (segment && segment.at(-1)?.index === index - 1) {
                segment.push({ index, position: entry.position });
            } else {
                rankedSegments.push([{ index, position: entry.position }]);
            }
        }
        const gridPositions = Array.from({ length: Math.floor((maxRank - 1) / 2) + 1 }, (_, index) => index * 2 + 1);
        const labelIndices = checkedHistory.length <= 7
            ? checkedHistory.map((_, index) => index)
            : [...new Set([0, ...Array.from({ length: 5 }, (_, index) => Math.round((checkedHistory.length - 1) * ((index + 1) / 6))), checkedHistory.length - 1])];

        return (
            <div className="w-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    role="img"
                    aria-label={`Ranking history for ${domain}: ${checkedHistory.length} checks, ${verifiedPositions.length} ranked`}
                    className="block w-full min-w-[520px]"
                >
                    <defs>
                        <linearGradient id="rank-history-area" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    {gridPositions.map((position) => (
                        <g key={position}>
                            <line x1={padding.left} x2={width - padding.right} y1={y(position)} y2={y(position)} stroke="var(--border)" strokeDasharray="4 5" />
                            <text x={padding.left - 10} y={y(position) + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="12">#{position}</text>
                        </g>
                    ))}
                    <line x1={padding.left} x2={width - padding.right} y1={y(unrankedPosition)} y2={y(unrankedPosition)} stroke="var(--border)" strokeDasharray="4 5" />
                    <text x={padding.left - 10} y={y(unrankedPosition) + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="11">Not ranked</text>
                    <text
                        x="15"
                        y={padding.top + plotHeight / 2}
                        textAnchor="middle"
                        fill="var(--muted-foreground)"
                        fontSize="11"
                        transform={`rotate(-90 15 ${padding.top + plotHeight / 2})`}
                    >
                        Position
                    </text>
                    {rankedSegments.map((segment) => {
                        const path = segment.map(({ index, position }, segmentIndex) =>
                            `${segmentIndex === 0 ? "M" : "L"} ${x(index)} ${y(position)}`,
                        ).join(" ");
                        const areaPath = segment.length > 1
                            ? `${path} L ${x(segment[segment.length - 1].index)} ${y(unrankedPosition)} L ${x(segment[0].index)} ${y(unrankedPosition)} Z`
                            : "";
                        return (
                            <g key={`rank-segment-${segment[0].index}`}>
                                {areaPath && <path d={areaPath} fill="url(#rank-history-area)" />}
                                {segment.length > 1 && <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                            </g>
                        );
                    })}
                    {checkedHistory.map((entry, index) => {
                        const isRanked = Number.isFinite(entry.position) && entry.position !== null && entry.position > 0;
                        const position = isRanked ? entry.position! : unrankedPosition;
                        return (
                            <g key={`${entry.date}-${index}`}>
                                <circle
                                    cx={x(index)}
                                    cy={y(position)}
                                    r={isRanked ? 6 : 7}
                                    fill={isRanked ? "var(--accent)" : "var(--muted-foreground)"}
                                    stroke="var(--background)"
                                    strokeWidth="2"
                                >
                                    <title>{isRanked
                                        ? `#${entry.position} on ${new Date(entry.date).toLocaleString()}`
                                        : `Not ranked in ${entry.resultsScanned || resultsScanned || "available"} checked results on ${new Date(entry.date).toLocaleString()}`}
                                    </title>
                                </circle>
                                {labelIndices.includes(index) && (
                                    <text x={x(index)} y={height - 12} textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">
                                        {new Date(entry.date).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
                <p className="text-xs text-muted-foreground text-center">
                    {verifiedPositions.length > 0
                        ? `Verified organic positions for ${domain}; lower numbers rank higher. Gray points mean the site was not found in the checked results.`
                        : `No verified ranking positions yet. The gray point records a completed check where ${domain} was not found in the ${resultsScanned || "available"} results scanned.`}
                    {" "}Active keywords are checked daily.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center py-10 text-center">
            <Calendar size={32} className="mb-3 text-muted-foreground opacity-60" />
            <p className="font-medium text-foreground">No ranking checks recorded yet</p>
            {status === "checking" ? (
                <p className="mt-2 text-sm text-muted-foreground">The current Google results are being checked.</p>
            ) : (
                <p className="mt-2 text-sm text-muted-foreground">Use Refresh Now to check the current results. Active keywords are also checked daily.</p>
            )}
            {status === "completed" && resultsScanned > 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                    {domain} was not found in the {resultsScanned} organic results checked. Competitor results are available in the Competitors tab.
                </p>
            ) : status === "failed" ? (
                <p className="mt-2 text-sm text-muted-foreground">
                    This check failed before ranking data could be recorded. Use Refresh Now to retry.
                </p>
            ) : null}
        </div>
    );
}

export default function RankDetail() {
    const { id } = useParams();
    const { api } = useApp();
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [loadError, setLoadError] = useState("");
    const fetchTracking = useCallback(async () => {
        if (!id) return;
        try {
            const response = await api.get(`/api/rank/${id}`);
            setTracking(response.data.tracking);
            setLoadError("");
            if (response.data.tracking.status !== "checking") setRefreshing(false);
        } catch (error) {
            setTracking(null);
            setLoadError(error instanceof Error ? error.message : "Could not load keyword tracking.");
            setRefreshing(false);
        } finally {
            setLoading(false);
        }
    }, [api, id]);

    const handleRefresh = async () => {
        if (!tracking) return;
        setRefreshing(true);
        try {
            const response = await api.post(`/api/rank/${tracking._id}/refresh`);
            setTracking(response.data.tracking);
            if (response.data.tracking.status === "failed") {
                toast.error(response.data.tracking.lastError || "The rank check failed.");
            } else {
                toast.success("Rank check completed.");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not start the rank check");
        } finally {
            setRefreshing(false);
        }
    };

    const getChangeIndicator = (change: number) => {
        if (change > 0) return { icon: <TrendingUp size={16} />, text: `+${change}`, class: "text-emerald-500" };
        if (change < 0) return { icon: <TrendingDown size={16} />, text: `${change}`, class: "text-danger" };
        return { icon: <Minus size={16} />, text: "—", class: "text-muted-foreground" };
    };

    const getPositionColor = (pos: number | null) => {
        if (pos === null) return "text-muted-foreground";
        if (pos <= 3) return "text-emerald-500";
        if (pos <= 10) return "text-primary";
        if (pos <= 20) return "text-accent";
        return "text-danger";
    };

    useEffect(() => {
        (async () => await fetchTracking())();
    }, [fetchTracking]);

    useEffect(() => {
        if (tracking?.status !== "checking") return;
        const interval = window.setInterval(() => {
            void fetchTracking();
        }, 3000);
        return () => window.clearInterval(interval);
    }, [fetchTracking, tracking?.status]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!tracking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center glass-strong rounded-2xl p-10">
                    <AlertCircle size={48} className="mx-auto text-danger mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">{loadError ? "Could Not Load Tracking" : "Tracking Not Found"}</h2>
                    {loadError && <p role="alert" className="mt-2 text-sm text-muted-foreground">{loadError}</p>}
                    <Link to="/rank-tracker" className="bg-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground mt-4 inline-block" style={{ color: "var(--background)" }}>
                        Back to Rank Tracker
                    </Link>
                </div>
            </div>
        );
    }

    const change = getChangeIndicator(tracking.positionChange);
    const tabs = [
        { id: "overview", label: "Overview" },
        { id: "competitors", label: `Competitors (${tracking.competitors.length})` },
        { id: "history", label: "History" },
    ];
    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Back + Header */}
                <div className="mb-8">
                    <Link to="/rank-tracker" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
                        <ArrowLeft size={16} />
                        Back to Rank Tracker
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-foreground">
                                "<span className="gradient-text">{tracking.keyword}</span>"
                            </h1>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Globe size={14} />
                                <span>{tracking.domain}</span>
                                <a href={tracking.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                    Visit <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                        <button onClick={handleRefresh} disabled={refreshing || tracking.status === "checking"} className="glass px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-muted/50 transition-all disabled:opacity-50 self-start text-foreground">
                            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                            Refresh Now
                        </button>
                    </div>
                </div>

                {/* Score Hero */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" style={{ animationDelay: "100ms" }}>
                    <div className="glass-strong rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Target size={14} />
                            Current Position
                        </p>
                        {tracking.status === "checking" ? <Loader2 size={32} className="animate-spin mx-auto text-primary" /> : <p className={`text-4xl font-bold ${getPositionColor(tracking.currentPosition)}`}>{tracking.currentPosition !== null ? `#${tracking.currentPosition}` : tracking.status === "failed" ? "Check failed" : "Not ranked"}</p>}
                        {tracking.currentPage && <p className="text-xs text-muted-foreground mt-1">Page {tracking.currentPage}</p>}
                    </div>

                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <TrendingUp size={14} />
                            Position Change
                        </p>
                        <div className={`text-3xl font-bold flex items-center justify-center gap-2 ${change.class}`}>
                            {change.icon}
                            {change.text}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">since last check</p>
                    </div>

                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Trophy size={14} />
                            Best Position
                        </p>
                        <p className={`text-3xl font-bold ${getPositionColor(tracking.bestPosition)}`}>{tracking.bestPosition ? `#${tracking.bestPosition}` : "—"}</p>
                        <p className="text-xs text-muted-foreground mt-1">all time</p>
                    </div>

                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Calendar size={14} />
                            Data Points
                        </p>
                        <p className="text-3xl font-bold text-accent">{tracking.rankHistory.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tracking.lastChecked ? `Last: ${new Date(tracking.lastChecked).toLocaleDateString()}` : "Never checked"}</p>
                    </div>
                </div>

                {tracking.status === "failed" && (
                    <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <p>{tracking.lastError || "The latest rank check failed. Use Refresh Now to try again."}</p>
                    </div>
                )}
                {tracking.status === "completed" && tracking.currentPosition === null && (
                    <div role="status" className="mb-6 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                        This domain was not found in the {tracking.resultsScanned || "available"} Google results checked for this keyword.
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-6 overflow-x-auto pb-1" style={{ animationDelay: "200ms" }}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                            style={activeTab === tab.id ? { color: "var(--background)" } : {}}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div key={activeTab}>
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            {/* Ranking Chart */}
                            <div className="glass rounded-2xl p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <TrendingUp size={20} className="text-primary" />
                                    Ranking History
                                </h3>
                                <RankingChart
                                    history={tracking.rankHistory || []}
                                    domain={tracking.domain}
                                    status={tracking.status}
                                    resultsScanned={tracking.resultsScanned}
                                />
                            </div>

                            {/* Top 3 Competitors Preview */}
                            {tracking.competitors.length > 0 && (
                                <div className="glass rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                            <Users size={20} className="text-accent" />
                                            Top Competitors
                                        </h3>
                                        <button onClick={() => setActiveTab("competitors")} className="text-sm text-primary hover:underline">
                                            View All →
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {tracking.competitors.slice(0, 3).map((comp, i) => (
                                            <div key={i} className="glass rounded-xl p-4 flex items-start gap-4">
                                                <div
                                                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        i === 0 ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" : i === 1 ? "bg-gray-400/15 text-gray-300 border border-gray-400/30" : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                                                    }`}
                                                >
                                                    #{comp.position}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{comp.title || comp.domain}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{comp.domain}</p>
                                                </div>
                                                <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary shrink-0 transition-colors">
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "competitors" && (
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Users size={20} className="text-accent" />
                                Competitors for "{tracking.keyword}"
                            </h3>
                            {tracking.competitors.length > 0 ? (
                                <div className="space-y-3">
                                    {tracking.competitors.map((comp, i) => (
                                        <div key={i} className="glass rounded-xl p-4 hover:bg-muted/50 transition-all">
                                            <div className="flex items-start gap-4">
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        comp.position <= 3 ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : comp.position <= 10 ? "bg-primary/15 text-primary border border-primary/30" : "bg-accent/15 text-accent border border-accent/30"
                                                    }`}
                                                >
                                                    #{comp.position}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">{comp.title || "Untitled"}</p>
                                                    <p className="text-xs text-primary mt-0.5">{comp.domain}</p>
                                                    {comp.snippet && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{comp.snippet}</p>}
                                                </div>
                                                <a href={comp.url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all shrink-0">
                                                    <ExternalLink size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No competitor data available yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "history" && (
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-accent" />
                                Ranking History
                            </h3>
                            {tracking.rankHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {[...tracking.rankHistory]
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((entry, i) => (
                                            <div key={i} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-muted/50 transition-all">
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        entry.position === null
                                                            ? "bg-muted text-muted-foreground border border-border"
                                                            : entry.position <= 3
                                                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                                              : entry.position <= 10
                                                                ? "bg-primary/15 text-primary border border-primary/30"
                                                                : entry.position <= 20
                                                                  ? "bg-accent/15 text-accent border border-accent/30"
                                                                  : "bg-danger/15 text-danger border border-danger/30"
                                                    }`}
                                                >
                                                    {entry.position ? `#${entry.position}` : "—"}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {new Date(entry.date).toLocaleDateString("en-US", {
                                                            weekday: "short",
                                                            year: "numeric",
                                                            month: "short",
                                                            day: "numeric",
                                                        })}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        {entry.page && <span className="text-xs text-muted-foreground">Page {entry.page}</span>}
                                                        {entry.title && <span className="text-xs text-muted-foreground truncate">{entry.title}</span>}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className={`text-lg font-bold ${getPositionColor(entry.position)}`}>{entry.position || "N/R"}</p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No history data yet. Data will appear after the first rank check.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
