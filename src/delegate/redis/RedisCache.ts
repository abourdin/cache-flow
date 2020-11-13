import { CacheOptions } from '../../Cache';
import redisClientProvider from '../../redis/RedisClientProvider';

/**
 * Cache class allowing to manage a Redis cache.
 */
export class RedisCache {
  private readonly cacheId: string;
  private readonly maxAge: number;
  private redisClient: any;
  private asyncRedisClient: any;
  private ioRedisClient: any;

  /**
   * Constructor.
   *
   * @param {String} cacheId the identifier of the cache
   * @param maxAge
   */
  constructor(cacheId: string, { expirationTime }: CacheOptions) {
    this.cacheId = cacheId;
    this.maxAge = expirationTime;
    this.redisClient = redisClientProvider.getRedisClient();
    this.asyncRedisClient = redisClientProvider.getAsyncRedisClient();
    this.ioRedisClient = redisClientProvider.getIORedisClient();
  }

  /**
   * Gets a cached value.
   *
   * @param {String} key the cache key
   * @return {Object} the cached value
   */
  async get(key: any): Promise<any> {
    if (!(typeof key === 'string' || key instanceof String)) {
      throw new Error(`Key must be a string, got: ${key}`);
    }
    const fullKey = this.buildKey(key);
    let value = undefined;
    try {
      const cachedValue = await this.asyncRedisClient.get(fullKey);
      if (cachedValue !== undefined) {
        value = JSON.parse(cachedValue);
      }
    }
    catch (error) {
      console.error(`Failed to get value from Redis cache '${this.cacheId}' for key="${fullKey}": ${error}`);
      this.asyncRedisClient.del(fullKey);
    }
    return value;
  }

  async set(key: any, value: any): Promise<void> {
    if (!(typeof key === 'string' || key instanceof String)) {
      throw new Error(`Key must be a string, got: ${key}`);
    }
    const fullKey = this.buildKey(key);
    try {
      if (this.maxAge) {
        await this.asyncRedisClient.set(fullKey, JSON.stringify(value), 'EX', this.maxAge);
      }
      else {
        await this.asyncRedisClient.set(fullKey, JSON.stringify(value));
      }
    }
    catch (error) {
      console.error(`Failed to set entry in Redis cache '${this.cacheId}' for key="${fullKey}", value="${value}": ${error}`);
    }
  }

  /**
   * Checks if a cache entry exists for a given key.
   *
   * @param {any} key
   * @return {boolean} true if the entry exists in the cache, false otherwise
   */
  async exists(key: any): Promise<boolean> {
    if (!(typeof key === 'string' || key instanceof String)) {
      throw new Error(`Key must be a string, got: ${key}`);
    }
    const fullKey = this.buildKey(key);
    try {
      return this.asyncRedisClient.exists(fullKey);
    }
    catch (error) {
      console.error(`Failed to check existence of entry in Redis cache '${this.cacheId}' for key="${fullKey}": ${error}`);
      return false;
    }
  }

  /**
   * Deletes a cache entry for a given key.
   *
   * @param {any} key
   */
  async delete(key: any): Promise<void> {
    if (!(typeof key === 'string' || key instanceof String)) {
      throw new Error(`Key must be a string, got: ${key}`);
    }
    const fullKey = this.buildKey(key);
    try {
      await this.asyncRedisClient.del(fullKey);
    }
    catch (error) {
      console.error(`Failed to delete entry in Redis cache '${this.cacheId}' for key '${fullKey}': ${error}`);
    }
  }

  /**
   * Deletes all entries in the cache.
   */
  async reset(): Promise<void> {
    const cacheId = this.cacheId;
    const keyPattern = this.buildKey('*');
    const stream = this.ioRedisClient.scanStream({ match: keyPattern, count: 100 });
    const self = this;
    return new Promise((resolve, reject) => {
      stream.on('data', function (matchingKeys: string[]) {
        for (const matchingKey of matchingKeys) {
          self.redisClient.del(matchingKey);
        }
      });
      stream.on('end', function () {
        resolve();
        console.info(`Redis cache '${cacheId}' has been cleared`);
      });
      stream.on('error', function (error: any) {
        reject(`Error occurred while scanning keys in redis cache '${cacheId}': ${error}`);
      });
    });
  }

  private buildKey(key: any): string {
    if (!(typeof key === 'string')) {
      throw new Error(`Key must be a String, got: ${key}`);
    }
    return this.cacheId + '#!' + key;
  }
}
