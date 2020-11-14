# Cache Flow

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000)](#)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://img.shields.io/badge/License-ISC-yellow.svg)

| Branch | CI Status | Coverage |
| --- | --- | --- |
| develop | [![develop CI Status](https://circleci.com/gh/abourdin/cache-flow/tree/develop.svg?style=shield)](https://app.circleci.com/pipelines/github/abourdin/cache-flow?branch=develop) | [![develop Coverage Status](https://codecov.io/github/abourdin/cache-flow/coverage.svg?branch=develop)](https://codecov.io/gh/abourdin/cache-flow/branch/develop) |
| master | [![master CI Status](https://circleci.com/gh/abourdin/cache-flow/tree/master.svg?style=shield)](https://app.circleci.com/pipelines/github/abourdin/cache-flow?branch=master) | [![master Coverage Status](https://codecov.io/github/abourdin/cache-flow/coverage.svg?branch=master)](https://codecov.io/gh/abourdin/cache-flow/branch/master) |

# Table of Contents

* [Installation](#installation)
* [Usage Example](#usage-example)
    - [A first simple cache](#a-first-simple-cache)
    - [A more advanced example](#a-more-advanced-example)
* [Custom serialization/deserialization](#custom-serializationdeserialization)
* [Configure Redis](#configure-redis)
* [Custom logger](#custom-logger) 
* [Use with dependency injection](#use-with-dependency-injection)

## Installation

```sh
npm install --save cache-flow
```

## Usage Example

### A first simple cache

1. Create a cache `SimpleCache.ts`

```typescript
import { CacheLoader } from 'cache-flow';

class StringStringCache extends CacheLoader<string, string> {

  constructor() {
    super('simple-cache-1', {
      expirationTime: 3600,
      maxSize: 100
    });
  }

  protected async load(key: string): Promise<string> {
    const now = new Date();
    return key + '-' + now.getTime();
  }

}
```

2. Use your cache

```typescript
const cache = new SimpleCache();
const myValue = cache.get('myKey');
console.log(myValue);
```

3. What happened behind the scenes

Unlike lots of cache libraries, with **Cache Flow**, you don't need to manually check if a key exists in your cache before trying to get it, and set the value yourself afterwards.

When you call the `get` function of your cache, **Cache Flow** automatically takes care of calling the load function your previously defined, and stores the value for a later call.

So if you call `get` right after, giving the same key, it will bypass the loader function, and directly pull the value from the inner cache.

### A more advanced example

```typescript
class UserProfileCache extends CacheLoader<User, UserProfile> {

  constructor() {
    super('user-profile-cache', {
      expirationTime: 3600,
      maxSize: 3000
    });
  }

  protected async load(user: User): Promise<UserProfile> {
    const profile = await userProfileService.getProfile(user);
    return profile;
  }
  
  protected keyToString(user: User): string {
    return user.id;
  }

}
```

**Cache Flow** allows you to define caches with more complex keys and values, which can be objects, arrays, ...

These caches require you to implement a `keyToString` function, transforming your key into a unique string identifying your key. It can be as simple as an ID, or a combination of several parameters that define your key, like:
```typescript
protected keyToString(channel: Channel): string {
  return `${channel.code}-${channel.language}`;
}
```

## Custom serialization/deserialization

When extending `Cache`, you cache will come with default serialization and deserialization implementations for the 
`serialize` and `deserialize` methods, which take care of storing objects and arrays as JSON in the inner cache, and transform
them back when getting values out of the cache.

In the case where you need to implement your own serialization and deserialization, for example to cache specific framework classes
or entities, your `CacheLoader` implementation can override `serialize` and `deserialize` methods:

```typescript
class MyEntityCache extends CacheLoader<string, MyEntity> {

  constructor() {
    super('my-entity-cache', {
      expirationTime: 3600,
      maxSize: 3000
    });
  }

  protected async load(id: string): Promise<MyEntity> {
    const entity = await repository.findById(id);
    return entity;
  }

  protected serialize(entity: MyEntity): any {
    let serializedValue;
    if (entity instanceof MyEntity) {
      serializedValue = { schemaName: entity.getSchemaName(), entity: instance.toJSON() };
    }
    else {
      serializedValue = entity;
    }
    return serializedValue;
  }

  protected deserialize(serialized: any): MyEntity {
    let unserializedValue;
    if (serialized && serialized.schemaName) {
      unserializedValue = MyEntity.fromJSON(serialized.value);
    }
    else {
      unserializedValue = serialized;
    }
    return unserializedValue;
  }
  
}
```

## Configure Redis

**Cache Flow** also supports distributed caching by using Redis as the caching engine.
To have your cache instances use Redis behind the scenes, **Cache Flow** must be configured as part of the startup of your application,
before any cache is instantiated.

```typescript
import { CacheFlow } from 'cache-flow';

CacheFlow.configure({
  redis: {
    host: 'your.redis.server.com',
    port: 6379
  }
});

// all set, now you can start caching!
const cache = new SimpleCache();
```

But what if your Redis server has to restart or goes down? Don't worry, **Cache Flow** has got your covered!

In case your Redis server temporarily goes down, all your caches will automatically fallback to an in-memory LRU cache, until
your Redis server is back online. As soon as your caches can reconnect, they'll switch back to using Redis. This way, you
will never experience any interruption in your caching layer.

## Use with dependency injection

**Cache Flow** is compatible with your favorite Typescript DI framework, like [typedi](https://www.npmjs.com/package/typedi),
[tsyringe](https://www.npmjs.com/package/tsyringe), [InversifyJS](https://www.npmjs.com/package/inversify)...

For example, with typedi:

```typescript
import { CacheLoader } from 'cache-flow';
import { Inject, Service } from 'typedi';

@Service()
class UserCache extends CacheLoader<string, User> {

  @Inject()
  private userService: UserService;

  constructor() {
    super('user-cache', {
      expirationTime: 3600,
      maxSize: 100
    });
  }

  protected async load(userId: string): Promise<User> {
    return this.userService.getUserById(userId);
  }

}
```

## Custom Logger

**Cache Flow** comes with a default logger which can log various information about what happens with your caches (when values are get, loaded, some errors, ...)

By default, **Cache Flow** will only log errors to `console.error`, but you can provide your own logger in the initial configuration of the library, like [log4js](https://www.npmjs.com/package/log4js), [winston](https://www.npmjs.com/package/winston), ...

See the example below with [log4js](https://www.npmjs.com/package/log4js):

```typescript
import { CacheFlow } from 'cache-flow';
import * as log4js from 'log4js';

CacheFlow.configure({
  logger: log4js.getLogger()
});
```

You can also simply pass the `console` to get all logs output to the stdout, including `debug` logs, like so:

```typescript
import { CacheFlow } from 'cache-flow';

CacheFlow.configure({
  logger: console
});
```

# Project Information

## Author

👤 **Alexandre Bourdin <contact@abourdin.com>**

* Github: [@abourdin](https://github.com/abourdin)
* Website: https://www.abourdin.com
* LinkedIn: [@alexandre-bourdin-38090844](https://linkedin.com/in/alexandre-bourdin-38090844)

## Show your support

Give a ⭐️ if this project helped you!
