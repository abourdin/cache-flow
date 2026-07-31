import { assert } from 'chai';
import { CacheFlow } from '../src';
import { logger } from './utils/TestUtils';

describe('CacheFlow Configure Test', () => {

  after(async function () {
    // leave no Redis configuration behind for the following test files
    CacheFlow.configure({
      redis: undefined,
      logger: logger
    });
  });

  it('test should throw when only the Redis host is configured', async () => {
    assert.throws(
      () => CacheFlow.configure({ redis: { host: '127.0.0.1' } as any }),
      /both 'host' and 'port' are required/
    );
  });

  it('test should throw when only the Redis port is configured', async () => {
    assert.throws(
      () => CacheFlow.configure({ redis: { port: 6379 } as any }),
      /both 'host' and 'port' are required/
    );
  });

  it('test should throw when the Redis configuration is empty', async () => {
    assert.throws(
      () => CacheFlow.configure({ redis: {} as any }),
      /both 'host' and 'port' are required/
    );
  });

  it('test should not throw when no Redis configuration is given', async () => {
    CacheFlow.configure({ logger: logger });

    assert.isFalse(CacheFlow.isRedisConfigured());
  });

  it('test should accept a complete Redis configuration', async () => {
    CacheFlow.configure({ redis: { host: '127.0.0.1', port: 6379 } });

    assert.isTrue(CacheFlow.isRedisConfigured());
  });

  it('test should keep the previous configuration when a Redis configuration is rejected', async () => {
    CacheFlow.configure({ redis: undefined, logger: logger });

    assert.throws(() => CacheFlow.configure({ redis: { host: '127.0.0.1' } as any }));

    assert.equal(CacheFlow.getLogger(), logger);
    assert.isFalse(CacheFlow.isRedisConfigured());
  });

});
