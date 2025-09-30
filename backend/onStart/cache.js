const NodeCache = require("node-cache");

// Create a cache instance, TTL optional
const cache = new NodeCache({ stdTTL: 3600 * 24 * 30 }); // 1 hour TTL

module.exports = cache;
