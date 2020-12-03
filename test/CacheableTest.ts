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
    const date1 = await instance1.getResult('foo', 123);
    assert.isTrue(date1.startsWith('instance1-foo-'));

    const date2 = await instance1.getResult('foo', 123);
    assert.equal(date1, date2);

    const date3 = await instance1.getResult('bar', 123);
    assert.isTrue(date3.startsWith('instance1-bar-'));
    assert.notEqual(date2, date3);

    const instance2 = new CacheableExampleClass('instance2');

    const date4 = await instance2.getResult('bar', 123);
    const date5 = await instance1.getResult('bar', 123);
    const date6 = await instance2.getResult('bar', 234);
    assert.equal(date3, date4);
    assert.equal(date4, date5);
    assert.notEqual(date4, date6);
  });

});
