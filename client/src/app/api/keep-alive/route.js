export const runtime = "edge";

const BACKEND_URL =
    process.env.RENDER_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://binksconnect.onrender.com";

const interval = parseInt(process.env.PING_INTERVAL || "300000", 10);

let lastPing = 0;

export async function GET() {
    const now = Date.now();
    if (now - lastPing < interval) {
        return Response.json({ status: "skipped", message: "Too soon" });
    }

    lastPing = now;
    try {
        const res = await fetch(BACKEND_URL, { cache: "no-store" });
        return Response.json({
            status: "ok",
            pinged: BACKEND_URL,
            backend: res.status,
        });
    } catch (err) {
        return Response.json(
            { status: "error", message: err.message },
            { status: 502 }
        );
    }
}
