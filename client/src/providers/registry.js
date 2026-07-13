const _registry = {};

export function registerProvider(id, providerClass) {
    _registry[id] = providerClass;
}

export function getProviderClass(id) {
    const cls = _registry[id];
    if (!cls) throw new Error(`Unknown provider: ${id}`);
    return cls;
}

export function getRegisteredProviders() {
    return Object.keys(_registry).map((id) => ({
        id,
        displayName: _registry[id].displayName || id,
        description: _registry[id].description || '',
        icon: _registry[id].icon || '🎵',
        enabled: _registry[id].enabled !== false,
        configSchema: _registry[id].getConfigSchema
            ? _registry[id].getConfigSchema()
            : [],
    }));
}
