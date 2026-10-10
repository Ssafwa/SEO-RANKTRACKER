/* eslint-disable react-refresh/only-export-components */
import { BarChart3Icon, EyeIcon, FileSearchIcon, GlobeIcon, ShieldIcon, TargetIcon, TrendingUpIcon, ZapIcon } from "lucide-react";

export const homeFeaturesData = [
    {
        icon: <BarChart3Icon size={28} />,
        title: "SEO Score",
        desc: "Review measured page metadata, headings, content, mobile setup, and crawl signals.",
    },
    {
        icon: <ZapIcon size={28} />,
        title: "Page Performance",
        desc: "See the live response time and HTML size for the page being audited.",
    },
    {
        icon: <ShieldIcon size={28} />,
        title: "Technical Checks",
        desc: "Check secure delivery, canonical URLs, robots directives, and social metadata.",
    },
    {
        icon: <EyeIcon size={28} />,
        title: "Accessibility Signals",
        desc: "Review image alternative text and the page's heading structure.",
    },
    {
        icon: <TargetIcon size={28} />,
        title: "Content Keywords",
        desc: "See common terms measured from the visible text on the audited page.",
    },
    {
        icon: <TrendingUpIcon size={28} />,
        title: "Actionable Recommendations",
        desc: "Get evidence-based fixes based on the page data Rank Pilot actually collected.",
    },
];

export const homeHowItWorksData = [
    {
        num: "01",
        icon: <GlobeIcon size={24} />,
        title: "Enter Your URL",
        desc: "Paste the public page you want Rank Pilot to audit.",
    },
    {
        num: "02",
        icon: <FileSearchIcon size={24} />,
        title: "Page is Scanned",
        desc: "Rank Pilot fetches the page and measures its real metadata, content, links, and images.",
    },
    {
        num: "03",
        icon: <BarChart3Icon size={24} />,
        title: "Review Your Report",
        desc: "See measured SEO scores and AI recommendations grounded in the scan.",
    },
];

export const homefooterLinks = [
    {
        title: "Product",
        links: [
            { label: "Analyze", to: "/analyze" },
            { label: "Rank Tracker", to: "/rank-tracker" },
            { label: "History", to: "/history" },
        ],
    },
    {
        title: "Learn more",
        links: [
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Features", href: "/#features" },
            { label: "Pricing", href: "/#pricing" },
        ],
    },
];

export const HomeWave = () => (
    <svg className="w-full h-[15vh] min-h-[60px] max-h-[120px]" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shapeRendering="auto">
        <defs>
            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
        </defs>
        <g className="parallax">
            <use xlinkHref="#gentle-wave" x="48" y="0" fill="var(--accent)" opacity="0.05" />
            <use xlinkHref="#gentle-wave" x="48" y="3" fill="var(--accent)" opacity="0.1" />
            <use xlinkHref="#gentle-wave" x="48" y="5" fill="var(--accent)" opacity="0.15" />
            <use xlinkHref="#gentle-wave" x="48" y="7" fill="var(--accent)" opacity="0.2" />
        </g>
    </svg>
);
