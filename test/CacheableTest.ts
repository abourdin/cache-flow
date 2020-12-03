import { assert } from 'chai';
import { CacheableExampleClass } from '../examples/CacheableExampleClass';
import { CacheFlow } from '../src';
import { configureLogger } from './utils/TestUtils';

const logger = configureLogger();

describe('Cacheable Test', () => {

  before(async function () {
    CacheFlow.configure({
      logger: logger
    });
  });

  after(async function () {
    await CacheFlow.resetAll();
  });

  it('test cacheable class method', async () => {
    const instance1 = new CacheableExampleClass('instance1');
    const value1 = await instance1.getResult('foo', 123);
    assert.isTrue(value1.startsWith('instance1-foo-'));

    const value2 = await instance1.getResult('foo', 123);
    assert.equal(value1, value2);

    const value3 = await instance1.getResult('bar', 123);
    assert.isTrue(value3.startsWith('instance1-bar-'));
    assert.notEqual(value2, value3);

    const instance2 = new CacheableExampleClass('instance2');

    const value4 = await instance2.getResult('bar', 123);
    const value5 = await instance1.getResult('bar', 123);
    const value6 = await instance2.getResult('bar', 234);
    assert.equal(value3, value4);
    assert.equal(value4, value5);
    assert.notEqual(value4, value6);

    await CacheFlow.delete('CacheableExampleClass#getResult', ['foo', 123]);

    const value7 = await instance1.getResult('foo', 123);
    assert.notEqual(value1, value7);

    await CacheFlow.reset('CacheableExampleClass#getResult');

    const value8 = await instance1.getResult('foo', 123);
    const value9 = await instance2.getResult('bar', 234);
    const value10 = await instance1.getResult('foo', 234);
    assert.notEqual(value8, value7);
    assert.notEqual(value9, value6);
    assert.notEqual(value10, value6);
  });

});
