import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { SearchIcon, GlobeIcon, FileSearchIcon, BrainIcon, CheckCircleIcon, AlertCircle, Loader2, ArrowRightIcon } from "lucide-react";
import { useApp } from "../context/AppContext";

const STEPS = [
    { icon: <GlobeIcon size={22} />, label: "Connecting to website", desc: "Checking the public site and following safe redirects..." },
    { icon: <FileSearchIcon size={22} />, label: "Scanning the page", desc: "Measuring metadata, content, links, and images..." },
    { icon: <BrainIcon size={22} />, label: "AI recommendations", desc: "Gemini is reviewing the measured page findings..." },
    { icon: <CheckCircleIcon size={22} />, label: "Report ready", desc: "Your measured SEO audit is complete." },
];

function getErrorMessage(error: unknown) {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message || error.message || "The website audit could not be completed.";
    }
    return error instanceof Error ? error.message : "The website audit could not be completed.";
}

export default function Analyze() {
    const [url, setUrl] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { api } = useApp();
    const activeRequest = useRef<AbortController | null>(null);
    const autoStarted = useRef(false);

    const handleAnalyze = useCallback(async (submitUrl = url) => {
        if (!submitUrl.trim() || analyzing) return;

        activeRequest.current?.abort();
        const controller = new AbortController();
        activeRequest.current = controller;
        setError("");
        setAnalyzing(true);
        setCurrentStep(0);
        setUrl(submitUrl);

        try {
            const created = await api.post("/api/analysis", { url: submitUrl.trim() }, { signal: controller.signal });
            const analysisId = created.data.analysis?._id;
            if (!analysisId) throw new Error("The API did not return an analysis ID.");
            setCurrentStep(1);

            for (let attempt = 0; attempt < 90; attempt += 1) {
                await new Promise((resolve) => window.setTimeout(resolve, 1500));
                const response = await api.get(`/api/analysis/${analysisId}`, { signal: controller.signal });
                const analysis = response.data.analysis;

                if (analysis.status === "completed") {
                    setCurrentStep(3);
                    navigate(`/report/${analysisId}`);
                    return;
                }
                if (analysis.status === "failed") {
                    throw new Error(analysis.error || "The website scan failed.");
                }
                if (attempt >= 2) setCurrentStep(2);
            }
            throw new Error("The website scan took too long. Check your history to see whether it completed.");
        } catch (requestError) {
            if (!controller.signal.aborted) setError(getErrorMessage(requestError));
        } finally {
            if (!controller.signal.aborted) {
                setAnalyzing(false);
                activeRequest.current = null;
            }
        }
    }, [api, analyzing, navigate, url]);

    useEffect(() => {
        const prefillUrl = searchParams.get("url");
        if (prefillUrl && !autoStarted.current) {
            autoStarted.current = true;
            void handleAnalyze(prefillUrl);
        }
    }, [handleAnalyze, searchParams]);

    useEffect(() => () => activeRequest.current?.abort(), []);

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void handleAnalyze();
    };

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-3xl mx-auto px-4 py-12">
                {!analyzing ? (
                    <div>
                        <div className="text-center mb-10 mt-24">
                            <h1 className="text-3xl sm:text-4xl font-medium text-foreground mb-3">
                                Analyze <span className="gradient-text">Any Website</span>
                            </h1>
                            <p className="text-muted-foreground">Enter a public URL for a live SEO scan with Gemini-powered recommendations.</p>
                        </div>

                        {error && (
                            <div role="alert" className="mb-6 px-4 py-3 rounded-xl severity-critical text-sm flex items-center gap-2 max-w-xl mx-auto">
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
                            <div className="border border-primary/20 rounded-full p-1.5 px-2 flex items-center gap-2">
                                <div className="flex items-center gap-3 flex-1 px-3">
                                    <SearchIcon size={20} className="text-muted-foreground shrink-0" />
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(event) => setUrl(event.target.value)}
                                        placeholder="Enter website URL (e.g., example.com)"
                                        className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none text-base py-3"
                                        id="analyze-url-input"
                                        autoFocus
                                        required
                                    />
                                </div>
                                <button type="submit" className="bg-primary px-6 py-3 rounded-full flex items-center gap-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity shrink-0" id="analyze-submit-btn" style={{ color: "var(--background)" }}>
                                    Analyze <ArrowRightIcon className="text-background size-4 shrink-0" />
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 text-center text-sm text-muted-foreground">
                            Examples:{" "}
                            {["github.com", "stripe.com", "vercel.com"].map((example, index) => (
                                <span key={example}>
                                    <button type="button" onClick={() => setUrl(example)} className="text-primary hover:underline">
                                        {example}
                                    </button>
                                    {index < 2 ? ", " : ""}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-medium text-foreground">Analyzing Your Website</h2>
                            <div className="flex justify-center items-center gap-2 mt-2">
                                <Loader2 size={16} className="text-primary/60 mt-0.5 animate-spin" />
                                <p className="text-muted-foreground sm:text-lg">{url}</p>
                            </div>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                            {STEPS.map((step, index) => {
                                const isComplete = index < currentStep;
                                const isCurrent = index === currentStep;
                                const isPending = index > currentStep;
                                return (
                                    <div key={step.label} className={`flex items-center gap-4 p-4 rounded-xl transition-all ${isCurrent ? "glass-strong border-primary/30" : isComplete ? "glass opacity-60" : "glass opacity-30"}`}>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isComplete ? "bg-success/15 text-success" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} style={isCurrent ? { color: "var(--background)" } : {}}>
                                            {isComplete ? <CheckCircleIcon size={20} /> : step.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${isPending ? "text-muted-foreground" : "text-foreground"}`}>{step.label}</p>
                                            <p className="text-xs text-muted-foreground">{step.desc}</p>
                                        </div>
                                        {isCurrent && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-8">This may take a little while for slower sites.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
