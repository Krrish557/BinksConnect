"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const inputClass =
        "w-full px-4 py-3 bg-[#1b272b] text-[#eae2d0] border border-[#5a482c] rounded-md outline-none focus:border-[#dfb872] focus:ring-1 focus:ring-[#dfb872] transition text-sm placeholder-[#8b7a5c]";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!email.trim()) {
            setError("Enter the email associated with your account.");
            return;
        }
        setLoading(true);
        try {
            await authService.forgotPassword(email.trim());
            setSent(true);
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <h3 className="text-[#dfb872] font-serif text-lg font-bold mb-2 text-center">
                Reset Password
            </h3>

            {sent ? (
                <div className="text-center space-y-4 py-3">
                    <div className="text-3xl">📬</div>
                    <p className="text-xs text-[#a39478]">
                        If an account exists for{" "}
                        <span className="text-[#eae2d0] font-medium">{email.trim()}</span>,
                        you&apos;ll receive a password reset link shortly.
                    </p>
                    <Link
                        href="/login"
                        className="inline-block py-2.5 px-6 rounded-md bg-[#233034] text-[#dfb872] font-semibold text-xs border border-[#7a6237] hover:bg-[#2c3b40] hover:text-[#fff0cf] transition shadow-lg"
                    >
                        Back to Login
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-xs text-[#a39478] mb-3 text-center">
                        We&apos;ll email you a link to reset your password.
                    </p>

                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email address"
                            autoComplete="email"
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
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>

                    <p className="text-xs text-center text-[#a39478] pt-2">
                        Remembered it?{" "}
                        <Link href="/login" className="text-[#dfb872] hover:text-[#fff0cf] hover:underline font-medium">
                            Log in
                        </Link>
                    </p>
                </form>
            )}
        </AuthLayout>
    );
}
