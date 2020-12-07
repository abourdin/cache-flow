import { fail } from 'assert';
import { assert } from 'chai';
import ErrorThrowingCache from '../examples/ErrorThrowingCache';
import { CacheFlow } from '../src';
import { logger } from './utils/TestUtils';

describe('CacheLoader Error Test', () => {

  before(async function () {
    CacheFlow.configure({
      logger: logger
    });
  });

  after(async function () {
    await CacheFlow.resetAll();
  });

  it('test should check basic cache functions', async () => {
    const cache1 = new ErrorThrowingCache();
    try {
      await cache1.get(0);
      fail('get call should have thrown an error');
    }
    catch (error) {
      assert.equal(error.message, 'Key cannot be 0');
    }
  });

});
