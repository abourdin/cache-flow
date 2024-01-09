import { CacheLoader } from './CacheLoader';
import { CacheFlowConfiguration, DefaultLogger, LoggerInterface, RedisCacheConfiguration } from './config/CacheFlowConfiguration';

export class CacheFlow {
  private static readonly instances: Map<string, CacheLoader<any, any>> = new Map();
  private static readonly nonCacheableInstances: Map<string, CacheLoader<any, any>> = new Map();

  private static configuration: CacheFlowConfiguration = {
    logger: new DefaultLogger()
  };

  public static configure(configuration: CacheFlowConfiguration) {
    this.configuration = { ...this.configuration, ...configuration };
    if (!configuration.logger) {
      this.configuration.logger = new DefaultLogger();
    }
  }

  public static isRedisConfigured(): boolean {
    return !!this.configuration?.redis?.host && !!this.configuration?.redis?.port;
  }

  public static getRedisConfiguration(): RedisCacheConfiguration {
    return this.configuration.redis;
  }

  public static getLogger(): LoggerInterface {
    return this.configuration.logger;
  }

  public static async resetAll(): Promise<void> {
    for (const cache of Array.from(this.instances.values())) {
      await cache.reset();
    }
  }

  public static get(cacheId: string): CacheLoader<any, any> {
    return this.nonCacheableInstances.get(cacheId);
  }

  public static async delete(cacheId: string, ...key: any[]): Promise<void> {
    const cache = this.instances.get(cacheId);
    if (cache) {
      if ((cache as any).isCacheable) {
        await cache.delete({ args: key });
      }
      else {
        await cache.delete(key[0]);
      }
    }
  }

  public static async reset(cacheId: string): Promise<void> {
    const cache = this.instances.get(cacheId);
    if (cache) {
      await cache.reset();
    }
  }

  public static getInstances(): CacheLoader<any, any>[] {
    return Array.from(this.nonCacheableInstances.values());
  }

  public static addInstance(cacheId: string, cache: CacheLoader<any, any>): void {
    this.instances.set(cacheId, cache);
    if (!(cache as any).isCacheable) {
      this.nonCacheableInstances.set(cacheId, cache);
    }
  }

}

