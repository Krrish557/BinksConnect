const { dbGet, dbAll } = require("../db/dbHelpers");

class ChannelAllocator {
    allocate() {
        throw new Error("Not implemented");
    }
}

class RoundRobinAllocator extends ChannelAllocator {
    constructor() {
        super();
        this._index = 0;
    }

    async allocate() {
        const channels = await dbAll("SELECT channel_id FROM telegram_channels WHERE is_active = 1");
        if (channels.length === 0) throw new Error("No active Telegram channels configured");
        const channel = channels[this._index % channels.length];
        this._index = (this._index + 1) % channels.length;
        return channel.channel_id;
    }
}

class LeastUsedAllocator extends ChannelAllocator {
    async allocate() {
        const channel = await dbGet(`
            SELECT tc.channel_id, COUNT(tf.track_id) as file_count
            FROM telegram_channels tc
            LEFT JOIN provider_mappings pm ON pm.telegram_channel_id = tc.channel_id AND pm.provider = 'telegram'
            LEFT JOIN provider_mappings tf ON tf.telegram_channel_id = tc.channel_id AND tf.provider = 'telegram'
            WHERE tc.is_active = 1
            GROUP BY tc.channel_id
            ORDER BY file_count ASC
            LIMIT 1
        `);
        if (!channel) throw new Error("No active Telegram channels configured");
        return channel.channel_id;
    }
}

class RandomAllocator extends ChannelAllocator {
    async allocate() {
        const channels = await dbAll("SELECT channel_id FROM telegram_channels WHERE is_active = 1");
        if (channels.length === 0) throw new Error("No active Telegram channels configured");
        const idx = Math.floor(Math.random() * channels.length);
        return channels[idx].channel_id;
    }
}

const allocators = {
    round_robin: RoundRobinAllocator,
    least_used: LeastUsedAllocator,
    random: RandomAllocator,
};

function createAllocator(strategy = "round_robin") {
    const AllocatorClass = allocators[strategy] || RoundRobinAllocator;
    return new AllocatorClass();
}

module.exports = { createAllocator, RoundRobinAllocator, LeastUsedAllocator, RandomAllocator };
