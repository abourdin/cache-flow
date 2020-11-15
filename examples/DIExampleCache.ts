import { Inject, Service } from 'typedi';
import { CacheLoader } from '../src';
import UserService, { User } from './utils/UserService';

@Service()
export default class DIExampleCache extends CacheLoader<string, User> {

  @Inject()
  private userService: UserService;

  constructor() {
    super('di-example-cache', {
      expirationTime: 3600
    });
  }

  protected async load(id: string): Promise<User> {
    return this.userService.getUser(id);
  }

}
