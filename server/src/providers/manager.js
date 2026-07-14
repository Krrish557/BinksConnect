const ProviderRegistry = require("./registry");
const NavidromeProvider = require("./navidrome");
const TelegramStorageProvider = require("./telegram");

const registry = new ProviderRegistry();

registry.register("navidrome", (config) => new NavidromeProvider(config));
registry.register("telegram", (config) => new TelegramStorageProvider(config));

class ProviderManager {
    constructor() {
        this._registry = registry;
    }

    getProvider(session) {
        const config = session.providerConfig;
        return this._registry.create(session.providerId, config);
    }

    hasProvider(providerId) {
        return this._registry.has(providerId);
    }

    listProviders() {
        return this._registry.list();
    }
}

module.exports = new ProviderManager();
