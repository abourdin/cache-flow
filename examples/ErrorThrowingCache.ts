import { CacheLoader } from '../src';

export default class ErrorThrowingCache extends CacheLoader<number, string> {

  constructor() {
    super('error-throwing-cache', {
      expirationTime: 3600
    });
  }

  protected async load(key: number): Promise<string> {
    if (key === 0) {
      throw new Error('Key cannot be 0');
    }
    else {
      return 'ok';
    }
  }

}
