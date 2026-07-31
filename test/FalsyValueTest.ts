import { assert } from 'chai';
import FalsyValueCache from '../examples/FalsyValueCache';
import { CacheFlow } from '../src';
import { logger } from './utils/TestUtils';

describe('Falsy Value Test', () => {

  beforeAll(async function () {
    CacheFlow.configure({
      logger: logger
    });
  });

  afterAll(async function () {
    await CacheFlow.resetAll();
  });

  it('test should serve a cached zero without reloading', async () => {
    const cache = new FalsyValueCache();
    await cache.reset();

    assert.equal(await cache.get('zero'), 0);
    assert.equal(await cache.get('zero'), 0);

    assert.equal(cache.loadCount, 1);
  });

  it('test should serve a cached empty string without reloading', async () => {
    const cache = new FalsyValueCache();
    await cache.reset();

    assert.equal(await cache.get('emptyString'), '');
    assert.equal(await cache.get('emptyString'), '');

    assert.equal(cache.loadCount, 1);
  });

  it('test should serve a cached false without reloading', async () => {
    const cache = new FalsyValueCache();
    await cache.reset();

    assert.equal(await cache.get('false'), false);
    assert.equal(await cache.get('false'), false);

    assert.equal(cache.loadCount, 1);
  });

  it('test should report a cached falsy value as cached', async () => {
    const cache = new FalsyValueCache();
    await cache.reset();

    await cache.get('zero');
    const result = await cache.getWithMetadata('zero');

    assert.equal(result.value, 0);
    assert.isTrue(result.cached);
    assert.equal(cache.loadCount, 1);
  });

  it('test should treat a cached null as absent and reload', async () => {
    const cache = new FalsyValueCache();
    await cache.reset();

    assert.isNull(await cache.get('null'));
    assert.isNull(await cache.get('null'));

    assert.equal(cache.loadCount, 2);
  });

  it('test should not report a reloaded null as cached', async () => {
    const cache = new FalsyValueCache();
    await cache.reset();

    await cache.set('null', null); // an explicitly stored null is still treated as absent when read back
    const result = await cache.getWithMetadata('null');

    assert.isNull(result.value);
    assert.isFalse(result.cached);
    assert.equal(cache.loadCount, 1);
  });

  it('test should not store a null or undefined loaded value', async () => {
    const cache = new FalsyValueCache();
    await cache.reset();

    await cache.get('null');
    assert.isFalse(await cache.exists('null'));

    await cache.get('unknownKey'); // the loader resolves to undefined for this one
    assert.isFalse(await cache.exists('unknownKey'));
  });

  it('test should store a falsy loaded value', async () => {
    const cache = new FalsyValueCache();
    await cache.reset();

    await cache.get('zero');
    assert.isTrue(await cache.exists('zero'));

    await cache.get('false');
    assert.isTrue(await cache.exists('false'));
  });

});
