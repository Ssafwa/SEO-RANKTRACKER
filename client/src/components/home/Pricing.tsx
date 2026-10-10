import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function Pricing() {
    return (
        <section id="pricing" className="relative md:min-h-screen flex flex-col justify-center items-center max-lg:py-24">
            <div className="bg-dot-pattern absolute inset-0 -z-1 opacity-10"></div>
            <div className="max-w-5xl w-full mx-auto px-4 ">
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-foreground">
                        Simple <span className="gradient-text">Pricing</span>
                    </h2>
                    <p className="text-muted-foreground">All currently available features are free to use.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    {/* Free */}
                    <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
                        <h3 className="text-xl font-semibold mb-1 text-foreground">Free</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-foreground">$0</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {["Live website SEO audits", "Measured page findings", "Google keyword rank checks", "Saved audit history", "JSON report export"].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle size={16} className="text-primary shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link to="/register" className="block w-full py-3 rounded-xl bg-primary/10 text-secondary-foreground text-center text-sm  hover:opacity-90 transition-colors">
                            Get Started Free
                        </Link>
                    </div>

                    {/* Pro */}
                    <div className="relative rounded-2xl p-8 flex flex-col bg-card border border-primary/30 overflow-hidden">
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium" style={{ color: "var(--background)" }}>
                            Planned
                        </div>
                        <h3 className="text-xl font-semibold mb-1 text-foreground">Pro (planned)</h3>
                        <p className="text-sm text-muted-foreground mb-6">Paid plans are not available yet.</p>
                        <ul className="space-y-3 mb-8 flex-1">
                            {["Higher audit limits", "Automated rank checks", "Additional reporting options"].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle size={16} className="text-muted-foreground shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-center text-sm text-muted-foreground">Coming soon</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
