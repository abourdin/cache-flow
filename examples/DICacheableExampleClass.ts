import { Service } from 'typedi';
import { Cacheable } from '../src';
import { sleep } from '../test/utils/TestUtils';

class User {
  id: string;
  username: string;
}

@Service()
export class DICacheableExampleClass {

  @Cacheable({
    argsToKey: (user: User) => {
      return user.id;
    }
  })
  public async getResult(user: User): Promise<string> {
    await sleep(100);
    const now = new Date();
    return `${user.username}-${now.getTime()}${now.getMilliseconds()}`;
  }

}
