import { CacheFlowConfiguration, DummyLogger, LoggerInterface, RedisCacheConfiguration } from './config/CacheFlowConfiguration';

export class CacheFlow {
  private static configuration: CacheFlowConfiguration = {
    logger: new DummyLogger()
  };

  public static configure(configuration: CacheFlowConfiguration) {
    this.configuration = { ...this.configuration, ...configuration };
    if (!configuration.logger) {
      this.configuration.logger = new DummyLogger();
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
}

