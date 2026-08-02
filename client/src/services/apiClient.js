const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://binksconnect.onrender.com";

class ApiClient {
    constructor() {
        this._token = null;
        if (typeof window !== "undefined") {
            this.loadToken();
        }
    }

    setToken(token) {
        this._token = token;
        if (typeof window !== "undefined") {
            if (token) {
                localStorage.setItem("binks_token", token);
            } else {
                localStorage.removeItem("binks_token");
            }
        }
    }

    loadToken() {
        if (typeof window !== "undefined") {
            this._token = localStorage.getItem("binks_token");
        }
        return this._token;
    }

    getToken() {
        if (!this._token && typeof window !== "undefined") {
            this._token = localStorage.getItem("binks_token");
        }
        return this._token;
    }

    getDeviceId() {
        if (typeof window === "undefined") return "dev_server";
        let id = localStorage.getItem("binks_device_id");
        if (!id) {
            id = `dev_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem("binks_device_id", id);
        }
        return id;
    }

    async request(method, path, body) {
        const headers = {
            "X-Device-Id": this.getDeviceId(),
        };
        if (this._token) {
            headers.Authorization = `Bearer ${this._token}`;
        }
        if (body) {
            headers["Content-Type"] = "application/json";
        }

        const res = await fetch(`${API_BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (res.status === 401) {
            this.setToken(null);
            throw new Error("Unauthorized");
        }

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        return res.json();
    }

    get(path) {
        return this.request("GET", path);
    }

    post(path, body) {
        return this.request("POST", path, body);
    }

    getStreamUrl(trackId) {
        const rawId = trackId.includes(":") ? trackId.split(":").pop() : trackId;
        const token = this._token || "";
        return `${API_BASE}/api/stream/${rawId}?token=${encodeURIComponent(token)}`;
    }

    getArtUrl(albumId) {
        const rawId = albumId.includes(":") ? albumId.split(":").pop() : albumId;
        const token = this._token || "";
        return `${API_BASE}/api/art/${rawId}?token=${encodeURIComponent(token)}`;
    }

    resolveUrl(path) {
        if (!path) return "";
        if (path.startsWith("http")) return path;
        const token = this._token || "";
        const separator = path.includes("?") ? "&" : "?";
        return `${API_BASE}${path}${separator}token=${encodeURIComponent(token)}`;
    }
}

export const apiClient = new ApiClient();
