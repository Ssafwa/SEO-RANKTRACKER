import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom"; // Removed unused component Navigate import
import { Mail, Lock, Loader2, ChartNoAxesColumnIcon, User2Icon } from "lucide-react";
import { useApp } from "../context/AppContext";
import toast from "react-hot-toast";

export default function Login({ state }: { state: string }) {
    const isLoginState = state === "login";
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, register } = useApp();

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        let result;
        if (isLoginState) {
            result = await login(email, password);
        } else {
            result = await register(name, email, password);
        }

        if (result.success) {
            const requestedRedirect = searchParams.get("redirect");
            const redirect = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
                ? requestedRedirect
                : "/dashboard";
            navigate(redirect);
        } else {
            toast.error(result.message || "Authentication failed");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="flex items-center justify-center gap-2 group mb-10">
                        <ChartNoAxesColumnIcon />
                        <span className="text-xl tracking-tight text-foreground">Rank Pilot</span>
                    </Link>
                </div>

                {/* Form Card */}
                <div className="bg-card border border-border rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="text-center py-5">
                            <h1 className="text-2xl text-foreground">
                                {isLoginState ? "Welcome back" : "Get Started"}
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                {isLoginState ? "Sign in to your" : "Create an"} Rank Pilot account
                            </p>
                        </div>

                        {!isLoginState && (
                            <label>
                                <div className="block text-sm text-foreground mb-1.5">Name</div>
                                <div className="relative">
                                    <User2Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full pl-11 pr-4 py-3 rounded-lg bg-muted/60 border border-border text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 transition-colors text-sm"
                                    />
                                </div>
                            </label>
                        )}
                        
                        <label>
                            <div className="block text-sm text-foreground mb-1.5 mt-4">Email</div>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-muted/60 border border-border text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 transition-colors text-sm"
                                />
                            </div>
                        </label>

                        <label>
                            <div className="block text-sm text-foreground mb-1.5 mt-4">Password</div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-11 pr-4 py-3 rounded-lg bg-muted/60 border border-border text-foreground placeholder-muted-foreground outline-none focus:border-primary/50 transition-colors text-sm"
                                />
                            </div>
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-5 rounded-lg bg-primary text-sm text-primary-foreground flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                            id="login-submit-btn"
                            style={{ color: "var(--background)" }}
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : isLoginState ? "Sign In" : "Create Account"}
                        </button>
                    </form>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-6">
                    {isLoginState ? "Don't have an account?" : "Already have an account?"}
                    <button type="button" onClick={() => navigate(isLoginState ? "/register" : "/login")} className="text-primary hover:underline font-medium pl-1">
                        {isLoginState ? "Sign up" : "Sign in"}
                    </button>
                </p>
            </div>
        </div>
    );
}