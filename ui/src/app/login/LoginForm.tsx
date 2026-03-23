"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Github, Mail, Lock, AlertCircle, Loader2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const error = searchParams.get("error");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(
        error === "CredentialsSignin" ? "Invalid email or password" : null
    );

    const handleCredentialsLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setAuthError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setAuthError("Invalid email or password");
                setIsLoading(false);
            } else {
                router.push(callbackUrl);
            }
        } catch {
            setAuthError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = (provider: "github" | "google") => {
        signIn(provider, { callbackUrl });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5" />

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                            <Activity className="text-white" size={32} strokeWidth={2.5} />
                        </div>
                        <h1 className="text-2xl font-bold">Welcome to Pulse</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* Error Message */}
                    {authError && (
                        <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive text-sm">
                            <AlertCircle size={16} />
                            {authError}
                        </div>
                    )}

                    {/* Credentials Form */}
                    <form onSubmit={handleCredentialsLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Email</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@pulse.io"
                                    required
                                    className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 ring-primary focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1.5">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-muted border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm focus:ring-2 ring-primary focus:outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium transition-all",
                                "hover:opacity-90 focus:ring-2 ring-primary ring-offset-2 ring-offset-background",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 size={16} className="animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                "Sign in"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleOAuthLogin("github")}
                            className="flex items-center justify-center gap-2 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium transition-colors"
                        >
                            <Github size={18} />
                            GitHub
                        </button>
                        <button
                            onClick={() => handleOAuthLogin("google")}
                            className="flex items-center justify-center gap-2 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm font-medium transition-colors"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </button>
                    </div>

                    {/* Demo Credentials */}
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground font-medium mb-2">Demo Credentials:</p>
                        <div className="space-y-1 text-xs">
                            <p><span className="text-muted-foreground">Admin:</span> admin@pulse.io / admin123</p>
                            <p><span className="text-muted-foreground">Viewer:</span> viewer@pulse.io / viewer123</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
}
