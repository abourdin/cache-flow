import { BaseCacheLoader, CacheOptions } from './BaseCacheLoader';
import { CacheFlow } from './CacheFlow';

/**
 * Cache class allowing to create caches with automatic cache loading and delegates.
 */
export abstract class CacheableLoader<K extends Object, V extends Object> extends BaseCacheLoader<K, V> {

  /**
   * Constructor.
   *
   * @param {String} cacheId the identifier of the cache
   * @param {CacheOptions} options the cache options:
   */
  protected constructor(cacheId: string, options: CacheOptions = {}) {
    super(cacheId, options);
    this.isCacheable = true;
    CacheFlow.addInstance(cacheId, this);
  }

}
