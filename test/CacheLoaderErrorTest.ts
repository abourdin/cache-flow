import { fail } from 'assert';
import { assert } from 'chai';
import * as log4js from 'log4js';
import ErrorThrowingCache from '../examples/ErrorThrowingCache';
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
