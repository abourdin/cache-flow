import { assert } from 'chai';
import { DefaultLogger } from '../src/config/CacheFlowConfiguration';
import { captureConsoleError } from './utils/TestUtils';

describe('DefaultLogger Test', () => {

  it('test should log an error message as a single argument', async () => {
    const logger = new DefaultLogger();

    const calls = captureConsoleError(() => logger.error('Failed to load value'));

    assert.deepEqual(calls, [['Failed to load value']]);
  });

  it('test should forward additional arguments after the error message', async () => {
    const logger = new DefaultLogger();

    const calls = captureConsoleError(() => logger.error('Error connecting to Redis: ', 'connect ECONNREFUSED'));

    assert.deepEqual(calls, [['Error connecting to Redis: ', 'connect ECONNREFUSED']]);
  });

  it('test should log a non-iterable object error without throwing', async () => {
    const logger = new DefaultLogger();
    const error = { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED 127.0.0.1:6379' };

    const calls = captureConsoleError(() => logger.error(error));

    assert.deepEqual(calls, [[error]]);
  });

  it('test should not log anything for non-error levels', async () => {
    const logger = new DefaultLogger();

    const calls = captureConsoleError(() => {
      logger.log('log message');
      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
    });

    assert.deepEqual(calls, []);
  });

});
