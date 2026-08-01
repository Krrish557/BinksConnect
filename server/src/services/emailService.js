const RESEND_API_URL = "https://api.resend.com/emails";

function getApiKey() {
    return process.env.RESEND_API_KEY;
}

function getFromAddress() {
    return process.env.RESEND_FROM || "BinksConnect <onboarding@resend.dev>";
}

async function sendMail(to, subject, html) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.log(`[Mail] Resend not configured (RESEND_API_KEY missing) — would send to ${to}: ${subject}`);
        return { skipped: true, to, subject };
    }
    console.log(`[Mail] Sending "${subject}" to ${to} via Resend`);
    try {
        const res = await fetch(RESEND_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: getFromAddress(),
                to,
                subject,
                html,
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(`Resend API ${res.status}: ${data.message || JSON.stringify(data)}`);
        }
        console.log(`[Mail] Sent OK id=${data.id} to ${to}`);
        return data;
    } catch (err) {
        console.error(`[Mail] Send FAILED to ${to}:`, err);
        throw err;
    }
}

async function sendOtp(to, code) {
    return sendMail(
        to,
        "Your BinksConnect verification code",
        `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #121212; border-radius: 12px; color: #ffffff;">
            <h2 style="margin: 0 0 8px; color: #1db954;">BinksConnect</h2>
            <p style="color: #b3b3b3;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; padding: 16px; background: #282828; border-radius: 8px; color: #ffffff;">${code}</div>
            <p style="color: #b3b3b3; font-size: 13px;">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
        </div>
        `
    );
}

async function sendPasswordReset(to, link) {
    return sendMail(
        to,
        "Reset your BinksConnect password",
        `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #121212; border-radius: 12px; color: #ffffff;">
            <h2 style="margin: 0 0 8px; color: #1db954;">BinksConnect</h2>
            <p style="color: #b3b3b3;">We received a request to reset your password. Click the button below to choose a new one:</p>
            <p style="text-align: center; margin: 24px 0;">
                <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #1db954; color: #000000; text-decoration: none; border-radius: 24px; font-weight: 700;">Reset password</a>
            </p>
            <p style="color: #b3b3b3; font-size: 13px;">If the button doesn't work, copy this link:<br/>${link}</p>
            <p style="color: #b3b3b3; font-size: 13px;">This link expires in 1 hour. If you didn't request it, you can ignore this email.</p>
        </div>
        `
    );
}

module.exports = { sendMail, sendOtp, sendPasswordReset };
