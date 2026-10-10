import { SearchIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HomeWave } from "../../assets/assets";

export default function Hero() {
    const [url, setUrl] = useState("");
    const navigate = useNavigate();

    const handleQuickAnalyze = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!url.trim()) return;
        navigate(`/analyze?url=${encodeURIComponent(url)}`);
    };

    return (
        <section className="max-w-2xl mx-auto px-4 py-40 sm:py-44 min-h-screen text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/2 rounded-full text-xs text-primary mb-6 border border-primary/10">
                <div className="relative flex items-center justify-center">
                    <div className="absolute bg-blue-600 size-2 rounded-full animate-ping"></div>
                    <div className="bg-blue-600 size-1.5 rounded-full"></div>
                </div>
                Live SEO checks • Google Gemini recommendations
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium leading-tight mb-6 text-foreground">
                Analyze & Boost Your <span className="gradient-text dm-serif">SEO Rankings</span>
            </h1>
            <p className="text-sm  text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">Get instant AI-powered SEO audits for any website. Uncover hidden issues, optimize performance, and outrank your competition.</p>

            {/* URL Input Bar */}
            <form onSubmit={handleQuickAnalyze} className="max-w-2xl mx-auto relative">
                <div className="bg-card border border-border rounded-full px-2 py-1.5 flex items-center gap-2 animate-pulse-glow">
                    <div className="flex items-center gap-2 flex-1 px-3">
                        <SearchIcon size={16} className="text-muted-foreground shrink-0" />
                        <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter website URL (e.g., example.com)" className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm py-2" id="hero-url-input" required />
                    </div>

                    <button type="submit" className="bg-primary px-5 py-2.5 rounded-full text-primary-foreground text-sm hover:opacity-90 transition-opacity shrink-0 flex items-center gap-2" id="hero-analyze-btn" style={{ color: "var(--background)" }}>
                        Analyze
                        <ArrowRightIcon size={14} />
                    </button>
                </div>
            </form>

            <p className="text-muted-foreground text-sm mt-6 ">Free to use • Create an account to save your reports</p>

            {/* Animated Wave */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none -z-1">
                <HomeWave />
            </div>
        </section>
    );
}
