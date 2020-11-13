import { differenceInMilliseconds, formatDistanceStrict } from 'date-fns';
import { LRUCache } from './delegate/lru/LRUCache';
import { RedisCache } from './delegate/redis/RedisCache';
import redisClientProvider from './redis/RedisClientProvider';

/**
 * Cache class allowing to create caches with automatic cache loading and delegates.
 */
export abstract class Cache<K extends Object, V extends Object> {
  private static readonly instances: Map<string, Cache<any, any>> = new Map();

  private readonly cacheDefinition: CacheDefinition;
  private delegate: LRUCache | RedisCache;

  /**
   * Constructor.
   *
   * @param {String} cacheId the identifier of the cache
   * @param {Object} cacheOptions the cache options:
   * * {Number} expirationTime: cache entries expiration time (seconds)
   * * {Number} maxSize: maximum number of cache entries
   */
  protected constructor(cacheId: string, { expirationTime, maxSize = 10000 }: CacheOptions = {}) {
    this.cacheDefinition = {
      id: cacheId,
      options: {
        expirationTime: formatDistanceStrict(0, expirationTime * 1000),
        maxSize
      },
      metadata: {}
    };
    Cache.instances.set(cacheId, this);
    this.delegate = new LRUCache(cacheId, { expirationTime, maxSize });
    const redisClient = redisClientProvider.getRedisClient();
    if (redisClient) {
      if (redisClient.connected) {
        console.debug(`Successfully connected to Redis server, switching '${cacheId}' to Redis Cache`);
        this.delegate = new RedisCache(cacheId, { expirationTime: expirationTime });
      }
      const self = this;
      redisClient.on('ready', function () {
        console.debug(`Successfully (re)connected to Redis server, switching '${cacheId}' to Redis Cache`);
        self.delegate = new RedisCache(cacheId, { expirationTime: expirationTime });
      });
      redisClient.on('error', function (error: { code: string; message: string }) {
        if (error.code === 'ECONNREFUSED') {
          if (self.delegate instanceof RedisCache) {
            console.error(`Error connecting to Redis cache, falling back '${cacheId}' to in-memory cache: `, error.message);
            self.delegate = new LRUCache(cacheId, { expirationTime: expirationTime, maxSize });
          }
        }
        else if (error.code === 'ECONNRESET') {
          console.error(`Error connecting to Redis cache: `, error.message);
        }
      });
    }
  }

  public static get(cacheId: string) {
    return Cache.instances.get(cacheId);
  }

  public static async delete(cacheId: string, key: any): Promise<void> {
    const cache = Cache.get(cacheId);
    if (cache) {
      await cache.delete(key);
    }
  }

  public static async reset(cacheId: string) {
    const cache = Cache.get(cacheId);
    if (cache) {
      await cache.reset();
    }
  }

  public static async resetAll() {
    for (const cache of Array.from(this.instances.values())) {
      await cache.reset();
    }
  }

  public static getInstances(): Cache<any, any>[] {
    return Array.from(this.instances.values());
  }

  public keyToString(key: K): string {
    if (typeof key === 'string') {
      return key;
    }
    else {
      throw new Error(`Method keyToString() must be overridden for cache ${this.getCacheId()}`);
    }
  }

  protected abstract async load(key: K): Promise<V>;

  protected serialize(value: V): any {
    return value;
  }

  protected deserialize(serializedValue: any): V {
    return serializedValue;
  }

  public getCacheId(): string {
    return this.cacheDefinition.id;
  }

  public getCacheDefinition(): CacheDefinition {
    return this.cacheDefinition;
  }

  protected addMetadata(metadata: CacheMetadata): void {
    this.cacheDefinition.metadata = { ...this.cacheDefinition.metadata, ...metadata };
  }

  /**
   * Gets a cached value.
   *
   * @param {K} key the cache key
   * @param {Boolean} force whether to force the cache refresh for that key (default: false)
   * @return {Promise<V>} the cached value
   */
  public async get(key: K, force: boolean = false): Promise<V> {
    let value;
    if (key === undefined) {
      return undefined;
    }
    if (!force) {
      console.debug(`Getting value for key '${this.keyToString(key)}' from cache '${this.getCacheId()}' (force=${force})`);
      try {
        const keyToString = this.keyToString(key);
        const cachedValue = await this.delegate.get(keyToString);
        if (cachedValue !== undefined) {
          value = this.deserialize(cachedValue);
        }
      }
      catch (error) {
        throw new Error(`Failed to get value from cache '${this.getCacheId()}' for key '${this.keyToString(key)}': ${error.message}`);
      }
    }
    if (!value) {
      value = await this.doLoadAndSet(key);
    }
    return value;
  }

  /**
   * @override
   *
   * Gets a cached value with additional metadata.
   *
   * @param {K} key the cache key
   * @param {Boolean} force whether to force the cache refresh for that key (default: false)
   * @return {Promise<Metadata<V>>} the cached value
   */
  public async getWithMetadata(key: K, force: boolean = false): Promise<Metadata<V>> {
    let value;
    let cached;
    const startTime = new Date();
    if (key === undefined) {
      return undefined;
    }
    if (!force) {
      console.debug(`Getting value for key '${this.keyToString(key)}' from cache '${this.getCacheId()}' (force=${force})`);
      try {
        const keyToString = this.keyToString(key);
        const cachedValue = await this.delegate.get(keyToString);
        if (cachedValue !== undefined) {
          value = this.deserialize(cachedValue);
          cached = true;
        }
      }
      catch (error) {
        throw new Error(`Failed to get value from cache '${this.getCacheId()}' for key '${this.keyToString(key)}': ${error.message}`);
      }
    }
    if (!value) {
      value = await this.doLoadAndSet(key);
      cached = false;
    }
    const time = differenceInMilliseconds(new Date(), startTime);
    return { value, time, cached };
  }

  public async set(key: K, value: V): Promise<void> {
    if (key === undefined || value === undefined) {
      console.error(`Tried to store undefined key or value in cache '${this.getCacheId()}': key="${this.keyToString(key)}", value="${value}"`);
    }
    else {
      const keyToString = this.keyToString(key);
      try {
        const serializedValue = this.serialize(value);
        return this.delegate.set(keyToString, serializedValue);
      }
      catch (error) {
        throw new Error(`Failed to set entry in cache '${this.getCacheId()}' for key '${keyToString}': ${error.message}`);
      }
    }
  }

  /**
   * Checks if a cache entry exists for a given key.
   *
   * @param {String} key
   * @return {Boolean} true if the entry exists in the cache, false otherwise
   */
  public async exists(key: K): Promise<boolean> {
    try {
      const keyToString = this.keyToString(key);
      return this.delegate.exists(keyToString);
    }
    catch (error) {
      throw new Error(`Failed to check existence of entry in cache '${this.getCacheId()}' for key '${this.keyToString(key)}': ${error.message}`);
    }
  }

  /**
   * Deletes a cache entry for a given key.
   *
   * @param {String} key
   */
  public async delete(key: K): Promise<void> {
    try {
      const keyToString = this.keyToString(key);
      await this.delegate.delete(keyToString);
    }
    catch (error) {
      throw new Error(`Failed to delete entry in cache '${this.getCacheId()}' for key '${this.keyToString(key)}': ${error.message}`);
    }
  }

  /**
   * Deletes all entries in the cache;
   */
  public async reset() {
    console.debug(`Clearing cache '${this.getCacheId()}'`);
    try {
      await this.delegate.reset();
    }
    catch (error) {
      throw new Error(`Failed to reset cache '${this.getCacheId()}': ${error.message}`);
    }
  }

  private async doLoadAndSet(key: K) {
    if (this.load) {
      console.debug(`Loading value for key '${this.keyToString(key)}' into cache '${this.getCacheId()}'`);
      try {
        const value = await this.load(key);
        if (key !== undefined && value !== undefined) {
          try {
            await this.set(key, value);
          }
          catch (error) {
            throw new Error(`Failed to set value in cache '${this.getCacheId()}' for key '${this.keyToString(key)}': ${error.message}`);
          }
        }
        return value;
      }
      catch (error) {
        throw new Error(`Failed to load value from cache '${this.getCacheId()}' for key '${this.keyToString(key)}': ${error.message}`);
      }
    }
    else {
      return undefined;
    }
  }
}

export interface CacheOptions {
  expirationTime?: number;
  maxSize?: number;
}

interface Metadata<V> {
  value: V;
  cached: boolean;
  time: number;
}

export interface CacheDefinition {
  id: string;
  options: {
    expirationTime: string;
    maxSize: number;
  };
  metadata: CacheMetadata;
}

interface CacheMetadata {
  type?: string;
  class?: string;
}
