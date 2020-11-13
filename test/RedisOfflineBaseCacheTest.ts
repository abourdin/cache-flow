global.process.env.REDIS_HOST = '127.0.0.1';
global.process.env.REDIS_PORT = '3456';

import { assert } from 'chai';
import SimpleCache1 from '../examples/SimpleCache1';

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
  });

  it('test should fallback to LRU cache when redis server is offline', async function () {
    this.timeout(0);

    const cache1 = new SimpleCache1();

    await sleep(500); // waiting for Cache to connect to Redis

    await redisServer.close();

    await sleep(1000); // waiting for Cache to detect Redis is down

    const value1 = await cache1.get('foo');
    const value2 = await cache1.get('foo');
    assert.equal(value1, value2);

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

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
