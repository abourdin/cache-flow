import { CacheLoader } from '../src';
import { sleep } from '../test/utils/TestUtils';

class User {
  id: string;
  username: string;
}

export default class ObjectStringCache extends CacheLoader<User, string> {

  constructor() {
    super('object-string-cache', {
      expirationTime: 3600,
      maxSize: 20
    });
  }

  protected async load(user: User): Promise<string> {
    await sleep(100);
    const now = new Date();
    return user.username + '-' + now.getTime() + now.getMilliseconds();
  }

  protected keyToString(user: User): string {
    return user.id;
  }

}
