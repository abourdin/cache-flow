import { CacheLoader } from '../src';
import { sleep } from '../test/utils/TestUtils';

export default class SimpleCache extends CacheLoader<string, string> {

  constructor() {
    super('simple-cache', {
      expirationTime: 3600,
      maxSize: 20
    });
  }

  protected async load(key: string): Promise<string> {
    await sleep(100);
    const now = new Date();
    return key + '-' + now.getTime() + now.getMilliseconds();
  }

}
