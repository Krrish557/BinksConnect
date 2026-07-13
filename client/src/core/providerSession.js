const STORAGE_KEY = 'binks_session';
const LEGACY_KEY = 'binks_user';

export function createSession(providerId, config, displayName) {
    const now = Date.now();
    return {
        providerId,
        authenticated: true,
        displayName: displayName || providerId,
        config: { ...config },
        createdAt: now,
        updatedAt: now,
    };
}

export function saveSession(session) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession() {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    return null;
}

export function clearSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}

export function migrateLegacySession() {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    try {
        const legacy = JSON.parse(raw);
        localStorage.removeItem(LEGACY_KEY);
        const providerId = legacy.provider;
        const session = createSession(providerId, {
            serverUrl: legacy.serverUrl,
            username: legacy.username,
            salt: legacy.salt,
            token: legacy.token,
        }, providerId);
        saveSession(session);
        return session;
    } catch {
        return null;
    }
}
