"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/authService";
import AuthLayout from "@/components/AuthLayout";

const inputClass =
    "w-full px-4 py-3 bg-[#1b272b] text-[#eae2d0] border border-[#5a482c] rounded-md outline-none focus:border-[#dfb872] focus:ring-1 focus:ring-[#dfb872] transition text-sm placeholder-[#8b7a5c]";

function ResetPasswordForm() {
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
            <div className="text-center space-y-4 py-3">
                <div className="text-3xl">✅</div>
                <p className="text-xs text-[#a39478]">
                    Your password has been reset. You can log in now.
                </p>
                <Link
                    href="/login"
                    className="inline-block py-2.5 px-6 rounded-md bg-[#233034] text-[#dfb872] font-semibold text-xs border border-[#7a6237] hover:bg-[#2c3b40] hover:text-[#fff0cf] transition shadow-lg"
                >
                    Go to Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-[#dfb872] font-serif text-lg font-bold mb-2 text-center">
                New Password
            </h3>

            <div>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    autoComplete="new-password"
                    className={inputClass}
                />
            </div>

            <div>
                <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className={inputClass}
                />
            </div>

            {error && (
                <p className="text-xs text-red-300 bg-red-950/40 border border-red-500/30 rounded-md px-3 py-2">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-md bg-[#233034] text-[#dfb872] font-semibold text-sm border border-[#7a6237] hover:bg-[#2c3b40] hover:text-[#fff0cf] hover:border-[#caa35e] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "Resetting..." : "Reset Password"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <AuthLayout>
            <Suspense fallback={<p className="text-xs text-[#a39478] text-center">Loading...</p>}>
                <ResetPasswordForm />
            </Suspense>
        </AuthLayout>
    );
}
