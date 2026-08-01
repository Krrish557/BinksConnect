"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
import AuthLayout from "@/components/AuthLayout";

const inputClass =
    "w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm placeholder-[#7a7a7a]";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!token) {
            setError("This reset link is invalid or missing.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await authService.resetPassword(token, password);
            setDone(true);
        } catch (err) {
            setError(err.message || "Could not reset your password.");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="text-center space-y-4">
                <div className="text-4xl">✅</div>
                <p className="text-sm text-[#B3B3B3]">
                    Your password has been reset. You can log in now.
                </p>
                <Link
                    href="/login"
                    className="inline-block py-3 px-6 rounded-full bg-[#1db954] text-black font-bold text-sm hover:bg-[#1ed760] transition"
                >
                    Go to login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1.5">
                    New password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className={inputClass}
                />
            </div>

            <div>
                <label className="block text-xs font-medium text-[#B3B3B3] mb-1.5">
                    Confirm new password
                </label>
                <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your new password"
                    autoComplete="new-password"
                    className={inputClass}
                />
            </div>

            {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full bg-[#1db954] text-black font-bold text-sm hover:bg-[#1ed760] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Resetting..." : "Reset password"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout
            title="Choose a new password"
            subtitle="Enter a new password for your account"
        >
            <Suspense fallback={<p className="text-sm text-[#B3B3B3]">Loading...</p>}>
                <ResetPasswordForm />
            </Suspense>
        </AuthLayout>
    );
}
