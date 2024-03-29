import { LRUCache } from 'lru-cache';
import { CacheOptions } from '../../BaseCacheLoader';

/**
 * Cache class allowing to bind an in-memory LRU Cache.
 */
export class LRUCacheWrapper {
  private readonly cacheId: string;
  private cache: any;

  /**
   * Constructor.
   *
   * @param {String} cacheId the identifier of the cache
   * @param {Object} cacheOptions the cache options:
   * * {Number} expirationTime: cache entries maximum age (seconds)
   * * {Number} maxSize: maximum number of cache entries
   */
  constructor(cacheId: string, { expirationTime, maxSize = 1000 }: CacheOptions) {
    this.cacheId = cacheId;
    this.cache = new LRUCache({
      ttl: expirationTime * 1000,
      max: maxSize,
      allowStale: false,
    });
  }

  /**
   * Gets a cached value.
   *
   * @param {String} key the cache key
   * @return {Object} the cached value
   */
  async get(key: string) {
    if (typeof key !== 'string') {
      throw new Error(`Key must be a string, got: ${key}`);
    }
    try {
      return this.cache.get(key);
    }
    catch (error) {
      throw new Error(`Failed to get value from LRU cache '${this.cacheId}' for key '${key}': ${error.message}`);
    }
  }

  async set(key: string, value: any) {
    if (typeof key !== 'string') {
      throw new Error(`Key must be a string, got: ${key}`);
    }
    try {
      await this.cache.set(key, value);
    }
    catch (error) {
      throw new Error(`Failed to set entry in LRU cache '${this.cacheId}' for key '${key}': ${error.message}`);
    }
  }

  /**
   * Checks if a cache entry exists for a given key.
   *
   * @param {String} key
   * @return {Boolean} true if the entry exists in the cache, false otherwise
   */
  async exists(key: string) {
    if (typeof key !== 'string') {
      throw new Error(`Key must be a string, got: ${key}`);
    }
    try {
      return this.cache.has(key);
    }
    catch (error) {
      throw new Error(
        `Failed to check existence of entry in LRU cache '${this.cacheId}' for key '${key}': ${error.message}`
      );
    }
  }

  /**
   * Deletes a cache entry for a given key.
   *
   * @param {String} key
   */
  async delete(key: string) {
    if (typeof key !== 'string') {
      throw new Error(`Key must be a string, got: ${key}`);
    }
    try {
      await this.cache.delete(key);
    }
    catch (error) {
      throw new Error(`Failed to delete entry in LRU cache '${this.cacheId}' for key '${key}': ${error.message}`);
    }
  }

  /**
   * Deletes all entries in the cache;
   */
  async reset() {
    try {
      await this.cache.clear();
    }
    catch (error) {
      throw new Error(`Failed reset LRU cache '${this.cacheId}': ${error.message}`);
    }
  }
}
