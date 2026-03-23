import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginSkeleton />}>
            <LoginForm />
        </Suspense>
    );
}

function LoginSkeleton() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 animate-pulse">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-muted rounded-2xl mb-4" />
                        <div className="h-6 w-48 bg-muted rounded" />
                        <div className="h-4 w-32 bg-muted rounded mt-2" />
                    </div>
                    <div className="space-y-4">
                        <div className="h-10 bg-muted rounded-lg" />
                        <div className="h-10 bg-muted rounded-lg" />
                        <div className="h-10 bg-muted rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
