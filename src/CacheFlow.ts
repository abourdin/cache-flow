import { CacheLoader } from './CacheLoader';
import { CacheFlowConfiguration, DefaultLogger, LoggerInterface, RedisCacheConfiguration } from './config/CacheFlowConfiguration';

export class CacheFlow {
  private static readonly instances: Map<string, CacheLoader<any, any>> = new Map();

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

  public static async resetAll() {
    for (const cache of Array.from(this.instances.values())) {
      await cache.reset();
    }
  }

  public static get(cacheId: string) {
    return this.instances.get(cacheId);
  }

  public static async delete(cacheId: string, key: any): Promise<void> {
    const cache = this.get(cacheId);
    if (cache) {
      await cache.delete(key);
    }
  }

  public static async reset(cacheId: string) {
    const cache = this.get(cacheId);
    if (cache) {
      await cache.reset();
    }
  }

  public static getInstances(): CacheLoader<any, any>[] {
    return Array.from(this.instances.values());
  }

  public static addInstance(cacheId: string, cache: CacheLoader<any, any>): void {
    this.instances.set(cacheId, cache);
  }
}

