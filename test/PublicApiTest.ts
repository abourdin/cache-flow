import { assert } from 'chai';
import SimpleCache from '../examples/SimpleCache';
import {
  CacheDefinition,
  CacheFlowConfiguration,
  CacheMetadata,
  CacheOptions,
  DefaultLogger,
  LoggerInterface,
  Metadata,
  RedisCacheConfiguration
} from '../src';
import { logger } from './utils/TestUtils';

describe('Public API Test', () => {

  it('test should expose the types describing cache options and definitions', async () => {
    const cache = new SimpleCache();

    const options: CacheOptions = { expirationTime: 3600, maxSize: 20 };
    const definition: CacheDefinition = cache.getCacheDefinition();
    const metadata: CacheMetadata = definition.metadata;

    assert.equal(options.maxSize, 20);
    assert.equal(definition.id, 'simple-cache');
    assert.equal(definition.options.maxSize, 20);
    assert.equal(definition.options.expirationTime, '1 hour');
    assert.isUndefined(metadata.type);
  });

  it('test should expose the type returned by getWithMetadata', async () => {
    const cache = new SimpleCache();

    const metadata: Metadata<string> = await cache.getWithMetadata('public-api-key');

    assert.isString(metadata.value);
    assert.isFalse(metadata.cached);
    assert.isNumber(metadata.time);
  });

  it('test should expose the configuration types and the default logger', async () => {
    const redis: RedisCacheConfiguration = { host: '127.0.0.1', port: 6379, db: 0 };
    const defaultLogger: LoggerInterface = new DefaultLogger();
    const configuration: CacheFlowConfiguration = { redis: redis, logger: logger };

    assert.equal(configuration.redis.host, '127.0.0.1');
    assert.equal(configuration.redis.port, 6379);
    assert.isFunction(defaultLogger.error);
  });

});
