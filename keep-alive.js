const url = process.env.PING_URL || "https://binksconnect.onrender.com";
const interval = parseInt(process.env.PING_INTERVAL || "300000", 10);

function ping() {
    fetch(url)
        .then((res) => {
            const now = new Date().toISOString().slice(11, 19);
            console.log(`[${now}] ${url} -> ${res.status} ${res.statusText}`);
        })
        .catch((err) => {
            const now = new Date().toISOString().slice(11, 19);
            console.error(`[${now}] ${url} -> ${err.message}`);
        });
}

console.log(`Keep-alive started — pinging ${url} every ${interval / 1000}s`);
ping();
setInterval(ping, interval);
