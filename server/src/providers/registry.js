class ProviderRegistry {
    constructor() {
        this._providers = new Map();
    }

    register(id, factory) {
        this._providers.set(id, factory);
    }

    create(id, config) {
        const factory = this._providers.get(id);
        if (!factory) throw new Error(`Unknown provider: ${id}`);
        return factory(config);
    }

    has(id) {
        return this._providers.has(id);
    }

    list() {
        return [...this._providers.keys()];
    }
}

module.exports = ProviderRegistry;
