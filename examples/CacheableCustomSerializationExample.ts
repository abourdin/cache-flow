import { Cacheable } from '../src';
import { sleep } from '../test/utils/TestUtils';

export class CacheableCustomSerializationExample {

  @Cacheable({
    argsToKey: (prefix: string, value: number) => {
      return `${prefix}-${value}`;
    },
    options: {
      expirationTime: 3600
    },
    serialize: function (value: any): any {
      return {
        json: JSON.stringify(value)
      };
    },
    deserialize: function (value: any): any {
      return JSON.parse(value.json);
    }
  })
  public async getResult(prefix: string, value: number): Promise<any> {
    await sleep(100);
    return {
      prefix: prefix,
      value: value,
      date: new Date().getTime()
    };
  }
}
