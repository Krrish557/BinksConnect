const NavidromeProvider = require("./navidrome");

class ProviderManager {
    getProvider(session) {
        const config = session.providerConfig;
        switch (session.providerId) {
            case "navidrome":
                return new NavidromeProvider(config);
            default:
                throw new Error(`Unknown provider: ${session.providerId}`);
        }
    }
}

module.exports = new ProviderManager();
