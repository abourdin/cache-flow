import { fail } from 'assert';
import { assert } from 'chai';
import SimpleCache from '../examples/SimpleCache';
import { CacheFlow } from '../src';
import { sleep } from './utils/TestUtils';

describe('BaseCache Test', () => {

  before(async function () {
    CacheFlow.configure({});
  });

  after(async function () {
    await CacheFlow.resetAll();
  });

  it('test should check basic cache functions', async () => {
    const cache1 = new SimpleCache();
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

  it('test should get errors when giving wrong key input', async () => {
    const cache1 = new SimpleCache();
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
