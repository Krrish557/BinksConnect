const { getDatabase } = require("../db/database");

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

    allocate() {
        const db = getDatabase();
        const channels = db.prepare("SELECT channel_id FROM telegram_channels WHERE is_active = 1").all();
        if (channels.length === 0) throw new Error("No active Telegram channels configured");
        const channel = channels[this._index % channels.length];
        this._index = (this._index + 1) % channels.length;
        return channel.channel_id;
    }
}

class LeastUsedAllocator extends ChannelAllocator {
    allocate() {
        const db = getDatabase();
        const channel = db.prepare(`
            SELECT tc.channel_id, COUNT(tf.track_id) as file_count
            FROM telegram_channels tc
            LEFT JOIN provider_mappings pm ON pm.telegram_channel_id = tc.channel_id AND pm.provider = 'telegram'
            LEFT JOIN provider_mappings tf ON tf.telegram_channel_id = tc.channel_id AND tf.provider = 'telegram'
            WHERE tc.is_active = 1
            GROUP BY tc.channel_id
            ORDER BY file_count ASC
            LIMIT 1
        `).get();
        if (!channel) throw new Error("No active Telegram channels configured");
        return channel.channel_id;
    }
}

class RandomAllocator extends ChannelAllocator {
    allocate() {
        const db = getDatabase();
        const channels = db.prepare("SELECT channel_id FROM telegram_channels WHERE is_active = 1").all();
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
