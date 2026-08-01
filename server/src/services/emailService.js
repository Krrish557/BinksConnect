const nodemailer = require("nodemailer");

let transporter = null;
let configured = null;

function getTransporter() {
    if (configured !== null) return transporter;
    configured = false;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) return null;

    transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || "465", 10),
        secure: (process.env.SMTP_PORT || "465") === "465",
        family: 4,
        auth: { user, pass },
    });
    configured = true;
    return transporter;
}

function getFromAddress() {
    return process.env.SMTP_FROM || (process.env.SMTP_USER ? `BinksConnect <${process.env.SMTP_USER}>` : "BinksConnect <no-reply@binksconnect.app>");
}

async function sendMail(to, subject, html) {
    const t = getTransporter();
    if (!t) {
        console.log(`[Mail] SMTP not configured — would send to ${to}: ${subject}`);
        return { skipped: true, to, subject };
    }
    return t.sendMail({
        from: getFromAddress(),
        to,
        subject,
        html,
    });
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
