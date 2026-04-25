const Redis = require('redis');

let redisClient = null;

const connectRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('⚠️ Redis not configured, skipping...');
    return null;
  }

  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis max retries reached');
            return new Error('Redis max retries reached');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    return null;
  }
};

// Cache helper functions
const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
};

const cacheSet = async (key, value, ttl = 3600) => {
  if (!redisClient) return false;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Redis set error:', error);
    return false;
  }
};

const cacheDel = async (key) => {
  if (!redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delete error:', error);
    return false;
  }
};

module.exports = { connectRedis, cacheGet, cacheSet, cacheDel, redisClient };