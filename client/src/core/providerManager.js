import { musicEngine } from '@/core/engine';
import { getProviderClass, getRegisteredProviders } from '@/providers/registry';
import {
    createSession,
    saveSession,
    loadSession,
    clearSession,
    migrateLegacySession,
} from '@/core/providerSession';

class ProviderManager {
    constructor() {
        this.session = null;
        this._listeners = new Set();
    }

    onChange(fn) {
        this._listeners.add(fn);
        return () => this._listeners.delete(fn);
    }

    _emit() {
        this._listeners.forEach((fn) => {
            try {
                fn(this.session);
            } catch {
            }
        });
    }

    load() {
        this.session = loadSession();
        if (!this.session) {
            this.session = migrateLegacySession();
        }
        return this.session;
    }

    isConfigured() {
        return !!this.session?.authenticated;
    }

    getSession() {
        return this.session;
    }

    getUserId() {
        return this.session?.config?.username || null;
    }

    getUser() {
        if (!this.session) return null;
        return {
            ...this.session.config,
            provider: this.session.providerId,
        };
    }

    getProviderId() {
        return this.session?.providerId || null;
    }

    getAvailableProviders() {
        return getRegisteredProviders();
    }

    async completeOnboarding(providerId, rawConfig) {
        const ProviderClass = getProviderClass(providerId);
        const validatedConfig = await ProviderClass.validateConfig(rawConfig);
        this.session = createSession(providerId, validatedConfig, ProviderClass.displayName);
        saveSession(this.session);
        this._initEngine();
        this._emit();
    }

    async reconnect() {
        if (!this.session) return;
        const ProviderClass = getProviderClass(this.session.providerId);
        const validatedConfig = await ProviderClass.validateConfig({
            ...this.session.config,
            password: '',
        });
        this.session.config = validatedConfig;
        this.session.updatedAt = Date.now();
        saveSession(this.session);
        this._initEngine();
        this._emit();
    }

    logout() {
        clearSession();
        this.session = null;
        musicEngine.reset();
        this._emit();
    }

    _initEngine() {
        if (!this.session) {
            musicEngine.reset();
            return;
        }
        const ProviderClass = getProviderClass(this.session.providerId);
        const provider = new ProviderClass(this.session.config);
        musicEngine.setProvider(provider);
    }

    initializeFromSession() {
        this.load();
        if (this.session) {
            this._initEngine();
            this._emit();
        }
    }
}

export const providerManager = new ProviderManager();
