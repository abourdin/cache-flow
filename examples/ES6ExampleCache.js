import { CacheFlow, CacheLoader } from '../src';

CacheFlow.configure({
  logger: console
});

export class ES6ExampleCache extends CacheLoader {

  load(key) {
    const now = new Date();
    return key + '-' + now.getTime() + now.getMilliseconds();
  }

}
