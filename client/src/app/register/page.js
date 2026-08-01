"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import AuthLayout from "@/components/AuthLayout";

export default function RegisterPage() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [otp, setOtp] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const inputClass =
        "w-full px-4 py-3 bg-[#282828] text-white rounded-lg outline-none focus:ring-2 focus:ring-[#1db954] transition text-sm placeholder-[#7a7a7a]";

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await authService.register(username.trim(), email.trim(), password);
            setStep(2);
        } catch (err) {
            setError(err.message || "Signup failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setError("");
        if (otp.trim().length !== 6) {
            setError("Enter the 6-digit code from your email.");
            return;
        }
        setLoading(true);
        try {
            await authService.verifyOtp(email.trim(), otp.trim());
            router.replace("/login?registered=1");
        } catch (err) {
            setError(err.message || "Verification failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setLoading(true);
        try {
            await authService.resendOtp(email.trim());
            setResendCooldown(60);
            const timer = setInterval(() => {
                setResendCooldown((c) => {
                    if (c <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return c - 1;
                });
            }, 1000);
        } catch (err) {
            setError(err.message || "Could not resend the code.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 1 ? "Create your account" : "Verify your email"}
            subtitle={
                step === 1
                    ? "Pick a unique username and password"
                    : `We sent a 6-digit code to ${email.trim()}`
            }
        >
            {step === 1 ? (
                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#B3B3B3] mb-1.5">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="3-30 characters (letters, numbers, _ . -)"
                            autoComplete="username"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[#B3B3B3] mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-[#B3B3B3] mb-1.5">
                            Password
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
                            Confirm password
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Repeat your password"
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
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[#B3B3B3] mb-1.5">
                            Verification code
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            inputMode="numeric"
                            maxLength={6}
                            className={`${inputClass} text-center tracking-[0.5em] text-lg`}
                            autoFocus
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
                        {loading ? "Verifying..." : "Verify email"}
                    </button>

                    <div className="flex items-center justify-between text-sm">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-[#B3B3B3] hover:text-white transition"
                        >
                            ← Change email
                        </button>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading || resendCooldown > 0}
                            className="text-[#1db954] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                        </button>
                    </div>
                </form>
            )}

            <p className="text-sm text-[#B3B3B3] mt-6 text-center">
                Already have an account?{" "}
                <Link href="/login" className="text-[#1db954] hover:underline font-medium">
                    Log in
                </Link>
            </p>
        </AuthLayout>
    );
}
