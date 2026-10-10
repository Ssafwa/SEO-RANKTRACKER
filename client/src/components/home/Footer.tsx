import { ChartNoAxesColumnIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { homefooterLinks } from "../../assets/assets";

export default function Footer() {
    return (
        <footer className="border-t border-border py-12 bg-card text-foreground">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <ChartNoAxesColumnIcon className="text-primary" />
                            <span className="text-xl">Rank Pilot</span>
                        </div>
                        <p className="text-sm text-muted-foreground w-5/6">
                            Live SEO audits and keyword ranking checks, saved to your account.
                        </p>
                    </div>

                    {homefooterLinks.map((section) => (
                        <div key={section.title}>
                            <h3 className="mb-4">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((item) => (
                                    <li key={item.label}>
                                        {"to" in item ? (
                                            <Link to={item.to} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <a href={item.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                                {item.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-border flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Rank Pilot</p>
                    <Link to="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Sign in
                    </Link>
                </div>
            </div>
        </footer>
    );
}
