global.process.env.REDIS_HOST = '127.0.0.1';
global.process.env.REDIS_PORT = '6379';

import { assert } from 'chai';
import SimpleCache1 from '../examples/SimpleCache1';
import { Cache } from '../src';

const RedisServer = require('redis-server');

describe('RedisBaseCache Test', () => {
  let redisServer: any;

  before(async function () {
    try {
      redisServer = new RedisServer(6379);
      await redisServer.open();
    }
    catch (error) {
      console.error('Could not start Redis server, maybe server is already running?');
    }
  });

  after(async function () {
    await Cache.resetAll();

    redisServer.close();
  });

  it('test should check basic cache functions over a Redis server', async function () {
    this.timeout(0);

    const cache1 = new SimpleCache1();

    await sleep(500); // waiting for Cache to connect to Redis

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
    return;
  });

});

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
