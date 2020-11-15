import { Service } from 'typedi';

@Service()
export default class UserService {

  public getUser(id: string): User {
    return {
      id: '123',
      username: 'john-doe'
    };
  }

}

export interface User {
  id: string;
  username: string;
}
