import { fail } from 'assert';
import { assert } from 'chai';
import ObjectStringCache from '../examples/ObjectStringCache';
import SimpleCache from '../examples/SimpleCache';
import { CacheFlow } from '../src';

describe('ObjectStringCache Test', () => {

  before(async function () {
    CacheFlow.configure({});
  });

  after(async function () {
    await CacheFlow.resetAll();
  });

  it('test should check basic cache functions', async () => {
    const user1 = {
      id: 'id-123',
      username: 'john-doe'
    };
    const user2 = {
      id: 'id-234',
      username: 'foo-bar'
    };

    const cache1 = new ObjectStringCache();
    const value1 = await cache1.get(user1);
    const value2 = await cache1.get(user1);
    assert.equal(value1, value2);

    assert.isTrue(await cache1.exists(user1));

    assert.isFalse(await cache1.exists(user2));

    await cache1.delete(user2);
    assert.isFalse(await cache1.exists(user2));

    await cache1.set(user2, 'my-value');
    assert.equal('my-value', await cache1.get(user2));

    await cache1.reset();
    assert.isFalse(await cache1.exists(user2));
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
