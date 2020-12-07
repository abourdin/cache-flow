import { Cacheable } from '../src';
import { sleep } from '../test/utils/TestUtils';

export class CacheableExampleClass {

  private readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  @Cacheable()
  public async getResult(prefix: string, value: number): Promise<string> {
    console.log(`getResult ${prefix} ${value}`);
    await sleep(100);
    const now = new Date();
    return `${this.id}-${prefix}-${now.getTime()}${now.getMilliseconds()}-${value * 3}`;
  }

}
