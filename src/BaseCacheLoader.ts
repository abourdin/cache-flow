import { differenceInMilliseconds, formatDistanceStrict } from 'date-fns';
import hash from 'object-hash';
import { CacheFlow } from './CacheFlow';
import { LRUCache } from './delegate/lru/LRUCache';
import { RedisCache } from './delegate/redis/RedisCache';
import { redisClientProvider } from './redis/RedisClientProvider';

/**
 * Cache class allowing to create caches with automatic cache loading and delegates.
 */
export abstract class BaseCacheLoader<K extends Object, V extends Object> {
  private readonly cacheDefinition: CacheDefinition;
  private readonly cacheOptions: CacheOptions;
  private delegate: LRUCache | RedisCache;
  private mode: 'LRU' | 'REDIS';
  protected isCacheable: boolean;

  /**
   * Constructor.
   *
   * @param {String} cacheId the identifier of the cache
   * @param {Object} cacheOptions the cache options:
   * * {Number} expirationTime: cache entries expiration time (seconds)
   * * {Number} maxSize: maximum number of cache entries
   */
  protected constructor(cacheId: string, { expirationTime = 24 * 60 * 60, maxSize = 1000 }: CacheOptions = {}) {
    this.cacheDefinition = {
      id: cacheId,
      options: {
        expirationTime: formatDistanceStrict(0, expirationTime * 1000),
        maxSize
      },
      metadata: {}
    };
    this.cacheOptions = { expirationTime, maxSize };

    this.switchToLRUMode();

    if (CacheFlow.isRedisConfigured()) {
      const redisClient = redisClientProvider.getRedisClient();

      const self = this;
      redisClient.on('ready', function () {
        CacheFlow.getLogger().debug(`Successfully (re)connected to Redis server, switching '${cacheId}' to Redis`);
        self.switchToRedisMode();
      });
      redisClient.on('error', function (error: { code: string; message: string }) {
        if (self.mode === 'REDIS') {
          if (error.code === 'ECONNREFUSED') {
            CacheFlow.getLogger().error(`Error connecting to Redis cache, falling back '${cacheId}' to in-memory LRU cache: `, error.message);
            self.switchToLRUMode();
          }
          else if (error.code === 'ECONNRESET') {
            CacheFlow.getLogger().error(`Error connecting to Redis: `, error.message);
            self.switchToLRUMode();
          }
        }
      });

      if (redisClient.status === 'ready') {
        CacheFlow.getLogger().debug(`Successfully connected to Redis server, '${cacheId}' is now using Redis`);
        this.switchToRedisMode();
      }
    }
  }

  protected abstract async load(key: K): Promise<V>;

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
      CacheFlow.getLogger().debug(`Getting value for key '${this.keyToString(key)}' from cache '${this.getCacheId()}' (force=${force})`);
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
      CacheFlow.getLogger().debug(`Getting value for key '${this.keyToString(key)}' from cache '${this.getCacheId()}' (force=${force})`);
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
      CacheFlow.getLogger().error(`Tried to store undefined key or value in cache '${this.getCacheId()}': key="${this.keyToString(key)}", value="${value}"`);
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
      CacheFlow.getLogger().debug(`Deleting key '${keyToString}' from cache '${this.getCacheId()}'`);
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
    CacheFlow.getLogger().debug(`Clearing cache '${this.getCacheId()}'`);
    try {
      await this.delegate.reset();
    }
    catch (error) {
      throw new Error(`Failed to reset cache '${this.getCacheId()}': ${error.message}`);
    }
  }

  public getCacheId(): string {
    return this.cacheDefinition.id;
  }

  public getCacheDefinition(): CacheDefinition {
    return this.cacheDefinition;
  }

  protected keyToString(key: K): string {
    if (typeof key === 'string') {
      return key;
    }
    else if (typeof key === 'number') {
      return key.toString();
    }
    else {
      return hash(key);
    }
  }

  protected serialize(value: V): any {
    let serializedValue;
    if (typeof value === 'object' || Array.isArray(value)) {
      serializedValue = { format: 'JSON', value: JSON.stringify(value) };
    }
    else {
      serializedValue = value;
    }
    return serializedValue;
  }

  protected deserialize(value: any): V {
    let unserializedValue;
    if (value && value.format === 'JSON') {
      unserializedValue = JSON.parse(value.value);
    }
    else {
      unserializedValue = value;
    }
    return unserializedValue;
  }

  protected addMetadata(metadata: CacheMetadata): void {
    this.cacheDefinition.metadata = { ...this.cacheDefinition.metadata, ...metadata };
  }

  private async doLoadAndSet(key: K) {
    if (this.load) {
      CacheFlow.getLogger().debug(`Loading value for key '${this.keyToString(key)}' into cache '${this.getCacheId()}'`);
      let value;
      try {
        value = await this.load(key);
      }
      catch (error) {
        CacheFlow.getLogger().error(`Failed to load value from cache '${this.getCacheId()}' for key '${this.keyToString(key)}': ${error.message}`);
        throw error;
      }
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
    else {
      throw new Error(`Cache '${this.getCacheId()}' must implement a load function`);
    }
  }

  private switchToLRUMode(): void {
    if (this.mode !== 'LRU') {
      this.mode = 'LRU';
      this.delegate = new LRUCache(this.getCacheId(), this.cacheOptions);
    }
  }

  private switchToRedisMode(): void {
    if (this.mode !== 'REDIS') {
      this.mode = 'REDIS';
      this.delegate = new RedisCache(this.getCacheId(), this.cacheOptions);
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
