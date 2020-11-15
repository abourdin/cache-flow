import { assert } from 'chai';
import SimpleCache from '../examples/SimpleCache';
import { CacheFlow } from '../src';
import { sleep } from './utils/TestUtils';

const RedisServer = require('redis-server');

describe('RedisOfflineBaseCache Test', () => {
  let redisServer: any;

  before(async function () {
    try {
      redisServer = new RedisServer(3456);
      await redisServer.open();
    }
    catch (error) {
      console.error(`Could not start Redis server: ${error.message}`);
    }

    CacheFlow.configure({
      redis: {
        host: '127.0.0.1',
        port: 3456
      }
    });
  });

  it('test should fallback to LRU cache when redis server is offline', async function () {
    this.timeout(0);

    const cache1 = new SimpleCache();

    await sleep(500); // waiting for Cache to connect to Redis

    await redisServer.close();

    await sleep(1000); // waiting for Cache to detect Redis is down

    const value1 = await cache1.get('foo');
    const value2 = await cache1.get('foo');
    assert.equal(value1, value2);

    const value3 = await cache1.getWithMetadata('foo');
    assert.equal(value1, value3.value);

    await sleep(100);

    const value4 = await cache1.get('foo', true);
    assert.notEqual(value1, value4);

    await sleep(100);

    const value5 = await cache1.getWithMetadata('foo', true);
    assert.notEqual(value4, value5.value);

    assert.isTrue(await cache1.exists('foo'));

    assert.isFalse(await cache1.exists('wrong'));

    await cache1.get('bar');
    assert.isTrue(await cache1.exists('bar'));

    await cache1.delete('bar');
    assert.isFalse(await cache1.exists('bar'));

    await cache1.set('baz', 'my-value');
    assert.equal('my-value', await cache1.get('baz'));

    await cache1.reset();
    assert.isFalse(await cache1.exists('foo'));
  });

});
