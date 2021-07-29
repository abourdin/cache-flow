# Cache Flow

[![Version](https://img.shields.io/npm/v/cache-flow.svg?style=flat)](#)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](#)
[![master CI Status](https://circleci.com/gh/abourdin/cache-flow/tree/master.svg?style=shield)](https://app.circleci.com/pipelines/github/abourdin/cache-flow?branch=master)
[![master Coverage Status](https://codecov.io/github/abourdin/cache-flow/coverage.svg?branch=master)](https://codecov.io/gh/abourdin/cache-flow/branch/master)
[![GitHub last commit](https://img.shields.io/github/last-commit/abourdin/cache-flow.svg?style=flat)](#)
[![NPM Downloads](https://img.shields.io/npm/dt/cache-flow.svg?style=flat)](#)

Allows to create configurable caches for NodeJS applications with automatic cache loading. Internal caching is supported
by an in-memory cache or Redis, with automatic fallback in case of Redis disconnection.

**Cache Flow** also provides a `@Cacheable` decorator for Typescript projects (inspired from Java/Spring), packing all
the caching features of this library into a single line of code, completely transparently for method callers.

# Table of Contents

* [Installation](#installation)
* [Usage Example](#usage-example)
    - [A first simple cache](#a-first-simple-cache)
    - [A more advanced example](#a-more-advanced-example)
    - [Using @Cacheable Typescript decorator](#using-cacheable-typescript-decorator)
    - [More examples](#more-examples)
* [Configuration](#configuration)
    - [Configure Redis](#configure-redis)
    - [Custom logger](#custom-logger)
    - [Detailed configuration](#detailed-configuration)
* [Custom serialization/deserialization](#custom-serializationdeserialization)
* [Usage with dependency injection](#use-with-dependency-injection)
* [Cache Flow Reference](#cacheflow-reference)
    - [CacheLoader<K, V> methods](#cacheloaderk-v-methods)
    - [CacheFlow methods](#cacheflow-methods)

## Installation

1. Install the library

```sh
npm install --save cache-flow
```

2. `reflect-metadata` shim is required:

`npm install --save reflect-metadata`

Make sure to import it before you use `cache-flow` (best is to import it at the top of your index file):

```typescript
import 'reflect-metadata';
```

## Usage Example

### A first simple cache

1. **Create a cache `SimpleCache.ts`**

1.a. **Typescript example:**

```typescript
import { CacheLoader } from 'cache-flow';

class SimpleCache extends CacheLoader<string, string> {

  constructor() {
    super('simple-cache-1', {
      expirationTime: 3600 // 1h in seconds
    });
  }

  protected async load(key: string): Promise<string> {
    const now = new Date();
    return key + '-' + now.getTime();
  }

}
```

_Also see the [code example](https://github.com/abourdin/cache-flow/blob/master/examples/SimpleCache.ts)_

1.b. **ES6 Javascript example:**

Even though it does not provide all the genericity **Cache Flow** comes with when used in a Typescript environment,
native javascript is also completely supported:

```javascript
import { CacheLoader } from 'cache-flow';
// also works with
// const { CacheLoader } = require('cache-flow');

class ES6ExampleCache extends CacheLoader {

  constructor() {
    super('es6-example-cache', {
      expirationTime: 3600 // 1h in seconds
    });
  }


  load(key) {
    const now = new Date();
    return key + '-' + now.getTime();
  }

}
```

_Also see the [code example](https://github.com/abourdin/cache-flow/blob/master/examples/ES6ExampleCache.ts)_

2. **Use your cache**

```typescript
const cache = new SimpleCache();
const myValue = cache.get('myKey');
setTimeout(function () {
  const myValue2 = cache.get('myKey');
  console.log(myValue);
  console.log(myValue2); // myValue2 has the same value as myValue!
}, 3000);
```

3. **What happened behind the scenes**

Unlike lots of cache libraries, with **Cache Flow**, you don't need to manually check if a key exists in your cache
before trying to get it, and set the value yourself afterwards.

When you call the `get` function of your cache, **Cache Flow** automatically takes care of calling the load function
your previously defined, and stores the value for a later call.

So if you call `get` right after, giving the same key, it will bypass the loader function, and directly pull the value
from the inner cache.

### A more advanced example

```typescript
class UserProfileCache extends CacheLoader<User, UserProfile> {

  constructor() {
    super('user-profile-cache', {
      expirationTime: 3600 // 1h in seconds
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

_Also see the [code example](https://github.com/abourdin/cache-flow/blob/master/examples/ObjectStringCache.ts)_

**Cache Flow** allows you to define caches with more complex keys and values, which can be objects, arrays, ...

This way, you can define your own cache key structures:

```typescript
class CustomCache extends CacheLoader<MyCacheKey, CachedObject> {

  constructor() {
    super('custom-cache-key', {
      expirationTime: 3600 // 1h in seconds
    });
  }

  protected async load(key: MyCacheKey): Promise<CachedObject> {
    const result = await doSomething(key);
    return result;
  }

}

interface MyCacheKey {
  id: string;
  someField: string;
  someOtherField: number;
}
```

A cache defined with such a key will compute a hash of your key objects to use as the internal cache key. You can also
define a custom `keyToString` function, transforming your key into a unique string identifying your key. It can be as
simple as an ID, or a combination of several parameters that define your key, like:

```typescript
class CustomCache extends CacheLoader<Identifier, string> {

  protected keyToString(identifier: Identifier): string {
    return `${identifier.code}-${identifier.language}`;
  }

}
```

### Using @Cacheable Typescript decorator

When using Typescript, you have access to a powerful shortcut to caching: you can annotate your class method
with `@Cacheable`. This automatically wraps your method call with a caching layer, meaning when calling your method,
**Cache Flow** will take care of checking for an existing cached value, and otherwise will execute the method to get
one. With this, adding a cache is completely transparent for anyone calling this method, without any other required
change than annotating your method with the `@Cacheable` decorator.

Here is an example:

```typescript
class CacheableExampleClass {

  private readonly id: string;

  constructor(id: string) {
    this.id = id;
  }

  @Cacheable()
  public async getResult(prefix: string, value: number): Promise<string> {
    await sleep(100);
    const now = new Date();
    return `${this.id}-${prefix}-${now.getTime()}${now.getMilliseconds()}-${value * 3}`;
  }

}
```

_Also see the [code example](https://github.com/abourdin/cache-flow/blob/master/examples/CacheableExampleClass.ts)_

`@Cacheable` provides the same flexibility as manually declaring a class cache: you can configure the `cacheId`,
`expirationTime` and `maxSize` parameters, as well as the `argsToKey`, `serialize` and `deserialize` functions (see
documentation below).

By default, `@Cacheable` will use [object-hash](https://www.npmjs.com/package/object-hash) on the array of arguments to
create a cache key. In cases where you have more complex objects as your cache key, and only want to use a subset of
these objects, you can define a custom way of inferring the cache key from arguments:

```typescript
@Cacheable({
  argsToKey: (user: User) => {
    user.id, user.lastUpdate
  },
  options: {
    expirationTime: 3600
  }
})
```

If `argsToKey` returns a string, this string is directly used a the cache key. Otherwise, the cache computes a hash of
the returned value and uses it as the cache key.

### More examples

You can find more examples in the `examples` folder of the source repository:
https://github.com/abourdin/cache-flow/tree/master/examples

## Configuration

### Configure Redis

**Cache Flow** also supports distributed caching by using Redis as the caching engine. To have your cache instances use
Redis behind the scenes, **Cache Flow** must be configured as part of the startup of your application, before any cache
is instantiated.

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

But what if your Redis server has to restart or goes down? Don't worry, **Cache Flow** has got you covered!

In case your Redis server temporarily goes down, all your caches will automatically fallback to an in-memory LRU cache,
until your Redis server is back online. As soon as your caches can reconnect, they'll switch back to using Redis. This
way, you will never experience any interruption in your caching layer.

### Custom Logger

**Cache Flow** comes with a default logger which can log various information about what happens with your caches (when
values are get, loaded, some errors, ...)

By default, **Cache Flow** will only log errors to `console.error`, but you can provide your own logger in the initial
configuration of the library, like [log4js](https://www.npmjs.com/package/log4js)
, [winston](https://www.npmjs.com/package/winston), ...

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

### Detailed configuration

1. `CacheLoader` constructor parameters:

- `cacheId`: a unique string identifying each cache. If shared between 2 caches or more, their keys might conflict, and
  cause deserialization errors when trying to get a key stored by another cache.
- `options`:
    * `expirationTime`: the time in seconds during which cache entries will be retained before being evicted
    * `maxSize`: the maximum number of entries stored in the cache when running in LRU mode. Once maximum is reached and
      a new entry is added to the cache, it replaces the least recently used.

2. `CacheFlow.configure(configuration)` configuration object parameter:

- `redis`:
    * `host`: the Redis server hostname
    * `port`: the Redis server port (default: 6379)
    * `db`: the Redis database index to use (default: 0)
- `logger`: a logger instance matching `LoggerInterface`

## Custom serialization/deserialization

When extending `CacheLoader`, your cache will come with default serialization and deserialization implementations for
the
`serialize` and `deserialize` methods, which take care of storing objects and arrays as JSON in the inner cache, and
transform them back when getting values out of the cache.

In the case where you need to implement your own serialization and deserialization, for example to cache specific
framework classes or entities, your `CacheLoader` implementation can override `serialize` and `deserialize` methods:

```typescript
class MyEntityCache extends CacheLoader<string, MyEntity> {

  constructor() {
    super('my-entity-cache', {
      expirationTime: 3600 // 1h in seconds
    });
  }

  protected async load(id: string): Promise<MyEntity> {
    const entity = await repository.findById(id);
    return entity;
  }

  protected serialize(entity: MyEntity): any {
    return entity.toJSON();
  }

  protected deserialize(serialized: any): MyEntity {
    return MyEntity.fromJSON(serialized);
  }

}
```

## Usage with dependency injection

**Cache Flow** is compatible with your favorite Typescript DI framework,
like [typedi](https://www.npmjs.com/package/typedi),
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
      expirationTime: 3600 // 1h in seconds
    });
  }

  protected async load(userId: string): Promise<User> {
    return this.userService.getUserById(userId);
  }

}
```

_Also see the [code example](https://github.com/abourdin/cache-flow/blob/master/examples/DIExampleCache.ts)_

## Notes

- LRU cache implementation used by **Cache Flow** supports
  using [cluster](https://nodejs.org/docs/latest-v13.x/api/cluster.html), so if running in cluster mode, your caches
  will be shared by all workers. Only requirement is that `CacheFlow.configure`
  method must be called from the master thread. In environment not running cluster, a standard LRU cache is used.

## CacheFlow Reference

[Full reference](https://abourdin.github.io/cache-flow/modules.html)

### CacheLoader<K, V> methods

[Full reference](https://abourdin.github.io/cache-flow/classes/cacheloader.html)

| Method | Example | Description |
| --- | --- | --- |
| `async get(key: K, force: boolean): Promise<V>` | `myCache.get('myKey')` | Gets a value from the cache. If force is set to true, a new value is loaded without checking existence in the cache. |
| `async getWithMetadata(key: K, force: boolean): Promise<Metadata<V>>` | `myCache.get('myKey')` | Gets a value from the cache with additional metadata (loading time, caching status, ...). If force is set to true, a new value is loaded without checking existence in the cache. |
| `async set(key: K, value: V): Promise<void>` | `myCache.set('myKey', 'myValue')` | Sets a value from the cache for the given key |
| `async delete(key: K): Promise<void>` | `myCache.delete('myKey')` | Evicts a key from the cache |
| `async exists(key: K): Promise<boolean>` | `myCache.exists('myKey')` | Checks whether a value exists in the cache for the given key |
| `async reset(): Promise<void>` | `myCache.reset()` | Clears all values from the cache |
| `getCacheId(): string` | myCache.getCacheId()` | Gets the cache's ID |
| `getCacheDefinition(): CacheDefinition` | `myCache.getCacheDefinition()` | Gets the cache definition |

### CacheFlow methods

[Full reference](https://abourdin.github.io/cache-flow/classes/cacheflow.html)

| Method | Example | Description |
| --- | --- | --- |
| `static configure(configuration: CacheFlowConfiguration)` | `CacheFlow.configure({redis: {port: 1234}})` | Sets the global configuration for Cache Flow and all subsequently instantiated caches |
| `static get(cacheId: string): Promise<CacheLoader<any, any>>` | `CacheFlow.get('my-cache')` | Gets cache with given cache ID. Cannot access caches created using @Cacheable annotation. |
| `static async delete(cacheId: string, key: any): Promise<void>` | `CacheFlow.delete('my-cache', 'myKey')` | Deletes entry for given key in cache with given cache ID |
| `static async reset(cacheId: string): Promise<void>` | `CacheFlow.reset('my-cache')` | Resets cache with given cache ID |
| `static async resetAll(): Promise<void>` | `CacheFlow.resetAll()` | Clears all caches |
| `static getInstances(): CacheLoader<any, any>[]` | `CacheFlow.getInstances()` | Gets all cache instances (except the ones created using @Cacheable annotation) |

# Project Information

## Author

👤 **Alexandre Bourdin <contact@abourdin.com>**

* Github: [@abourdin](https://github.com/abourdin)
* Website: https://www.abourdin.com
* LinkedIn: [@alexandre-bourdin-38090844](https://linkedin.com/in/alexandre-bourdin-38090844)

## Show your support

Give a ⭐️ if this project helped you!
