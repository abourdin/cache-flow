import { CacheLoader } from '../src';

/**
 * A cache whose loader returns falsy values, and counts how many times it was called.
 */
export default class FalsyValueCache extends CacheLoader<string, any> {

  public loadCount = 0;

  private readonly values: { [key: string]: any } = {
    zero: 0,
    emptyString: '',
    false: false,
    null: null
  };

  constructor() {
    super('falsy-value-cache', {
      expirationTime: 3600,
      maxSize: 20
    });
  }

  protected async load(key: string): Promise<any> {
    this.loadCount++;
    return this.values[key];
  }

}
