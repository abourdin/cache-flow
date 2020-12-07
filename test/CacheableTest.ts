import { assert } from 'chai';
import { Container } from 'typedi';
import { CacheableCustomSerializationExample } from '../examples/CacheableCustomSerializationExample';
import { CacheableExampleClass } from '../examples/CacheableExampleClass';
import { DICacheableExampleClass } from '../examples/DICacheableExampleClass';
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

    await CacheFlow.delete('CacheableExampleClass#getResult', 'foo', 123);

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

  it('test cacheable class method with DI injected class', async () => {
    const user1 = {
      id: 'id-123',
      username: 'john-doe'
    };
    const user2 = {
      id: 'id-234',
      username: 'foo-bar'
    };
    const user3 = {
      id: 'id-456',
      username: 'foo-baz'
    };

    const instance1 = Container.get(DICacheableExampleClass);
    const value1 = await instance1.getResult(user1);

    const value2 = await instance1.getResult(user1);
    assert.equal(value1, value2);

    const value3 = await instance1.getResult(user2);
    assert.notEqual(value2, value3);

    const instance2 = Container.get(DICacheableExampleClass);

    const value4 = await instance2.getResult(user2);
    const value5 = await instance1.getResult(user2);
    const value6 = await instance2.getResult(user3);
    assert.equal(value3, value4);
    assert.equal(value4, value5);
    assert.notEqual(value4, value6);

    await CacheFlow.delete('DICacheableExampleClass#getResult', user1);

    const value7 = await instance1.getResult(user1);
    assert.notEqual(value1, value7);

    await CacheFlow.reset('DICacheableExampleClass#getResult');

    const value8 = await instance1.getResult(user1);
    const value9 = await instance2.getResult(user2);
    const value10 = await instance1.getResult(user3);
    assert.notEqual(value8, value7);
    assert.notEqual(value9, value6);
    assert.notEqual(value10, value6);
  });

  it('test cacheable with custom serialization and deserialization', async () => {
    const instance = new CacheableCustomSerializationExample();
    const result1 = await instance.getResult('foo', 123);
    const result2 = await instance.getResult('foo', 123);
    assert.deepEqual(result1, result2);
  });

});
