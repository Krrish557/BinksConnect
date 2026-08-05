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
        "w-full px-5 py-4 bg-[#1b272b] text-[#eae2d0] border border-[#5a482c] rounded-lg outline-none focus:border-[#dfb872] focus:ring-2 focus:ring-[#dfb872]/40 transition-all text-base placeholder-[#8b7a5c]";

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
        <AuthLayout>
            {step === 1 ? (
                <form onSubmit={handleSignup} className="space-y-5">
                    <h3 className="text-[#dfb872] font-serif text-xl font-bold mb-4 text-center tracking-wide">
                        Create Your Account
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-[#b8aa8f] mb-1.5">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Unique username"
                            autoComplete="username"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#b8aa8f] mb-1.5">Email</label>
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
                        <label className="block text-sm font-medium text-[#b8aa8f] mb-1.5">Password</label>
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
                        <label className="block text-sm font-medium text-[#b8aa8f] mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Repeat password"
                            autoComplete="new-password"
                            className={inputClass}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-300 bg-red-950/50 border border-red-500/30 rounded-lg px-4 py-3">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-lg bg-[#233034] text-[#dfb872] font-bold text-base tracking-wide border border-[#7a6237] hover:bg-[#2c3b40] hover:text-[#fff0cf] hover:border-[#caa35e] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerify} className="space-y-5">
                    <h3 className="text-[#dfb872] font-serif text-xl font-bold mb-2 text-center tracking-wide">
                        Verify Email
                    </h3>
                    <p className="text-sm text-[#a39478] text-center mb-4">
                        Code sent to <span className="text-[#eae2d0] font-medium">{email.trim()}</span>
                    </p>

                    <div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            inputMode="numeric"
                            maxLength={6}
                            className={`${inputClass} text-center tracking-[0.5em] text-xl font-mono`}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-300 bg-red-950/50 border border-red-500/30 rounded-lg px-4 py-3">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-lg bg-[#233034] text-[#dfb872] font-bold text-base tracking-wide border border-[#7a6237] hover:bg-[#2c3b40] hover:text-[#fff0cf] hover:border-[#caa35e] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Verifying..." : "Verify Code"}
                    </button>

                    <div className="flex items-center justify-between text-sm pt-2">
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-[#a39478] hover:text-[#eae2d0] transition"
                        >
                            ← Change email
                        </button>
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={loading || resendCooldown > 0}
                            className="text-[#dfb872] hover:underline disabled:opacity-50"
                        >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                        </button>
                    </div>
                </form>
            )}

            <p className="text-sm text-[#a39478] mt-8 text-center tracking-wide">
                Already have an account?{" "}
                <Link href="/login" className="text-[#dfb872] hover:text-[#fff0cf] hover:underline font-semibold ml-1">
                    Log in
                </Link>
            </p>
        </AuthLayout>
    );
}
