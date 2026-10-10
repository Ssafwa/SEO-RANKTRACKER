import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ChartNoAxesColumnIcon, User, Mail, Lock } from "lucide-react";

export default function Register() {
    const { register } = useApp();
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading) return;

        setIsLoading(true);
        try {
            const result = await register(name, email, password);
            if (result.success) {
                toast.success("Account created successfully!");
                navigate("/dashboard");
            } else {
                toast.error(result.message || "Registration failed");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-2xl border border-border shadow-xl">
                {/* Header/Logo */}
                <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                        <ChartNoAxesColumnIcon size={32} />
                        <span className="text-2xl font-bold tracking-tight text-foreground">Rank Pilot</span>
                    </div>
                    <h2 className="text-xl font-semibold text-foreground mt-4">Get Started</h2>
                    <p className="text-sm text-muted-foreground">Create your Rank Pilot account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                                placeholder="Your name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors text-foreground"
                                placeholder="••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-xl text-sm hover:opacity-90 transition-opacity mt-2 disabled:opacity-50"
                        style={{ color: "var(--background)", backgroundColor: "white" }}
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-4">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}