import { SimpleCache } from '../src';

export default class SimpleCache1 extends SimpleCache<string, string> {

  constructor() {
    super('simple-cache-1', {
      expirationTime: 3600,
      maxSize: 20
    });
  }

  protected async load(key: string): Promise<string> {
    return key + '-' + new Date();
  }

}
