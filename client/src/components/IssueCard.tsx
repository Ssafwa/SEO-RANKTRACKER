import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Info } from "lucide-react";

interface Issue {
    severity: string;
    category: string;
    message: string;
    recommendation: string;
}

export default function IssueCard({ issue }: { issue: Issue }) {
    const [expanded, setExpanded] = useState(false);

    const severityConfig: Record<string, { icon: React.ReactNode; class: string; label: string }> = {
        critical: {
            icon: <AlertCircle size={16} />,
            class: "severity-critical",
            label: "Critical",
        },
        warning: {
            icon: <AlertTriangle size={16} />,
            class: "severity-warning",
            label: "Warning",
        },
        info: {
            icon: <Info size={16} />,
            class: "severity-info",
            label: "Info",
        },
    };

    const config = severityConfig[issue.severity] || severityConfig.info;

    return (
        <div className="glass rounded-xl overflow-hidden transition-all hover:border-primary/20">
            <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="flex items-start gap-3 p-4 w-full text-left">
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${config.class}`}>
                    {config.icon}
                    {config.label}
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-foreground">{issue.message}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{issue.category}</span>
                </span>
                <span className="text-muted-foreground shrink-0 mt-0.5">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
            </button>
            {expanded && (
                <div className="px-4 pb-4 border-t border-border pt-3">
                    <div className="flex items-start gap-2">
                        <span className="text-primary text-sm mt-0.5">💡</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{issue.recommendation}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
