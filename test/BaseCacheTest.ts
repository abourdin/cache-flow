import { fail } from 'assert';
import { assert } from 'chai';
import SimpleCache1 from '../examples/SimpleCache1';
import { Cache } from '../src';

describe('BaseCache Test', () => {

  after(async function () {
    await Cache.resetAll();
  });

  it('test should check basic cache functions', async () => {
    const cache1 = new SimpleCache1();
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

  it('test should get errors when giving wrong key input', async () => {
    const cache1 = new SimpleCache1();
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
