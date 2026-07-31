import { Cacheable } from '../src';
import { sleep } from '../test/utils/TestUtils';

class User {
  id: string;
  username: string;
}

export class CacheableDeprecatedKeyToStringExample {

  /**
   * Uses the deprecated `keyToString` option, which is kept as an alias of `argsToKey`.
   */
  @Cacheable({
    keyToString: (user: User) => {
      return user.id;
    }
  })
  public async getResult(user: User): Promise<string> {
    await sleep(100);
    const now = new Date();
    return `${user.username}-${now.getTime()}${now.getMilliseconds()}`;
  }

}
