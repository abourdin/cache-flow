import IORedis from 'ioredis';
import IoRedis from 'ioredis';
import { CacheFlow } from '../CacheFlow';

class RedisClientProvider {
  private ioRedisClient: IoRedis.Redis;

  public getRedisClient(): IORedis.Redis {
    const redisConfiguration = CacheFlow.getRedisConfiguration();
    const logger = CacheFlow.getLogger();
    if (!this.ioRedisClient) {
      try {
        this.ioRedisClient = new IoRedis({
          host: redisConfiguration.host,
          port: redisConfiguration.port || 6379,
          db: redisConfiguration.db || 0,
          retryStrategy: function (times: number) {
            return Math.min(times * 100, 3000);
          },
          maxRetriesPerRequest: 3
        });
        this.ioRedisClient.on('error', (error: any) => {
          logger.error('IORedis connection error: ', error);
        });
      }
      catch (error) {
        logger.error('Failed to instantiate IORedis client', error);
      }
    }
    return this.ioRedisClient;
  }
}

export const redisClientProvider = new RedisClientProvider();
