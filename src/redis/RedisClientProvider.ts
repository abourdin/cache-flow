import IORedis from 'ioredis';
import IoRedis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = Number.parseInt(process.env.REDIS_PORT || '6379');

class RedisClientProvider {
  private ioRedisClient: IoRedis.Redis;

  public getRedisClient(): IORedis.Redis {
    if (!this.ioRedisClient) {
      try {
        this.ioRedisClient = new IoRedis({
          host: REDIS_HOST,
          port: REDIS_PORT,
          retryStrategy: function (times: number) {
            return Math.min(times * 100, 3000);
          },
          maxRetriesPerRequest: 3
        });
        this.ioRedisClient.on('error', (error: any) => {
          console.error('IORedis connection error: ', error);
        });
      }
      catch (error) {
        console.error('Failed to instantiate IORedis client', error);
      }
    }
    return this.ioRedisClient;
  }
}

export const redisClientProvider = new RedisClientProvider();
