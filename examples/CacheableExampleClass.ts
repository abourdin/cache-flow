import { Cacheable } from '../src';
import { sleep } from '../test/utils/TestUtils';

export class CacheableExampleClass {

  private readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  @Cacheable({
    keyToString: (prefix: string, value: number) => {
      return `${prefix}-${value}`;
    },
    options: {
      expirationTime: 3600
    }
  })
  public async getResult(prefix: string, value: number): Promise<string> {
    await sleep(100);
    const now = new Date();
    return `${this.id}-${prefix}-${now.getTime()}${now.getMilliseconds()}-${value * 3}`;
  }

}
