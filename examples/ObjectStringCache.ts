import { BaseCache } from '../src';

class User {
  id: string;
  username: string;
}

export default class ObjectStringCache extends BaseCache<User, string> {

  constructor() {
    super('simple-cache-2', {
      expirationTime: 3600,
      maxSize: 20
    });
  }

  protected async load(user: User): Promise<string> {
    const now = new Date();
    return user.username + '-' + now.getTime() + now.getMilliseconds();
  }

  protected keyToString(user: User): string {
    return user.id;
  }

}
