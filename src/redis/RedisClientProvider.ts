import ioredis from 'ioredis';
import redis from 'redis';

const asyncRedis = require('async-redis');

class RedisClientProvider {
  private redisClient: redis.RedisClient;
  private asyncRedisClient: any;
  private ioRedisClient: ioredis.Redis;

  getRedisClient() {
    if (!this.redisClient) {
      try {
        this.redisClient = redis.createClient({
          host: process.env.REDIS_HOST,
          port: Number.parseInt(process.env.REDIS_PORT || '6379'),
          db: 0,
          retry_strategy: function (options: any) {
            if (options.total_retry_time > 1000 * 60 * 60) {
              return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });
        this.redisClient.on('error', function (error: any) {
          console.error('Redis client connection error: ', error);
        });
      }
      catch (error) {
        console.error('Failed to instantiate Redis client', error);
      }
    }
    return this.redisClient;
  }

  getAsyncRedisClient() {
    if (!this.asyncRedisClient) {
      try {
        this.asyncRedisClient = asyncRedis.decorate(this.getRedisClient());
      }
      catch (error) {
        console.error('Failed to instantiate async redis client', error);
      }
    }
    return this.asyncRedisClient;
  }

  getIORedisClient() {
    if (!this.ioRedisClient) {
      try {
        this.ioRedisClient = new ioredis({
          host: process.env.REDIS_HOST,
          port: Number.parseInt(process.env.REDIS_PORT || '6379'),
          retryStrategy: function (times: number) {
            return Math.min(times * 50, 2000);
          }
        });
        this.ioRedisClient.on('error', (error: any) => {
          console.error('ioRedis connection error: ', error);
        });
      }
      catch (error) {
        console.error('Failed to instantiate redis client', error);
      }
    }
    return this.ioRedisClient;
  }
}

export const redisClientProvider = new RedisClientProvider();
