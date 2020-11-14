import { fail } from 'assert';
import { assert } from 'chai';
import * as log4js from 'log4js';
import StringStringCache from '../examples/StringStringCache';
import { CacheFlow } from '../src';

const logger = log4js.getLogger();
logger.level = 'debug';
log4js.configure({
  appenders: {
    out: {
      type: 'stdout',
      layout: {
        type: 'pattern',
        pattern: '%[[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%p] [%f{1}]:%] %m'
      }
    }
  },
  categories: {
    default: {
      appenders: ['out'],
      level: 'debug',
      enableCallStack: true
    }
  }
});

describe('BaseCache Test', () => {

  before(async function () {
    CacheFlow.configure({
      logger: logger
    });
  });

  after(async function () {
    await CacheFlow.resetAll();
  });

  it('test should check basic cache functions', async () => {
    const cache1 = new StringStringCache();
    const value1 = await cache1.get('foo');
    const value2 = await cache1.get('foo');
    assert.equal(value1, value2);

    const value3 = await cache1.getWithMetadata('foo');
    assert.equal(value1, value3.value);

    assert.isTrue(await cache1.exists('foo'));

    assert.isFalse(await cache1.exists('wrong'));

    await cache1.get('bar');
    assert.isTrue(await cache1.exists('bar'));

    await cache1.delete('bar');
    assert.isFalse(await cache1.exists('bar'));

    await cache1.set('baz', 'my-value');
    assert.equal('my-value', await cache1.get('baz'));

    const value5 = await CacheFlow.get('simple-cache-1').get('baz');
    assert.equal('my-value', value5);

    await CacheFlow.reset('simple-cache-1');
    assert.isFalse(await cache1.exists('foo'));
  });

  it('test should get errors when giving wrong key input', async () => {
    const cache1 = new StringStringCache();
    try {
      await cache1.get(undefined);
      fail('should have thrown an error when getting undefined key');
    }
    catch (error) {
      // do nothing
    }

    try {
      await cache1.set(undefined, 'foo');
      fail('should have thrown an error when setting undefined key');
    }
    catch (error) {
      // do nothing
    }

    try {
      await cache1.exists(undefined);
      fail('should have thrown an error when checking exists for undefined key');
    }
    catch (error) {
      // do nothing
    }

    try {
      await cache1.delete(undefined);
      fail('should have thrown an error when deleting for undefined key');
    }
    catch (error) {
      // do nothing
    }
  });

});
