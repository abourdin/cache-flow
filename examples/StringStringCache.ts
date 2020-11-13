import { BaseCache } from '../src';

export default class StringStringCache extends BaseCache<string, string> {

  constructor() {
    super('simple-cache-1', {
      expirationTime: 3600,
      maxSize: 20
    });
  }

  protected async load(key: string): Promise<string> {
    const now = new Date();
    return key + '-' + now.getTime() + now.getMilliseconds();
  }

}
