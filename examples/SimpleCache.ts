import { CacheLoader } from '../src';

export default class SimpleCache extends CacheLoader<string, string> {

  constructor() {
    super('simple-cache', {
      expirationTime: 3600,
      maxSize: 20
    });
  }

  protected async load(key: string): Promise<string> {
    const now = new Date();
    return key + '-' + now.getTime() + now.getMilliseconds();
  }

}
