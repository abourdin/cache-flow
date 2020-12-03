import { CacheLoader, CacheOptions } from '../CacheLoader';

export function Cacheable({ cacheId, options: { expirationTime, maxSize }, keyToString, serialize, deserialize }: CacheableParams = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (descriptor === undefined) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }
    const className = target.constructor?.name || target.name;
    const resolvedCacheId = cacheId || `${className}#${propertyKey}`;
    const originalMethod = descriptor.value;

    class CacheableCache extends CacheLoader<CacheableKey, any> {
      constructor() {
        super(resolvedCacheId, {
          expirationTime: expirationTime || 3600,
          maxSize: maxSize || 1000
        });
        this.isCacheable = true;
      }

      protected async load(key: CacheableKey): Promise<any> {
        return originalMethod.apply(key.scope, key.args);
      }

      protected keyToString(key: CacheableKey): string {
        let str;
        if (keyToString) {
          str = keyToString.apply(key.scope, key.args);
        }
        else {
          str = JSON.stringify(key.args);
        }
        return str;
      }

      protected serialize(value: any): any {
        if (serialize) {
          return serialize.apply(this, value);
        }
        else {
          return super.serialize(value);
        }
      }

      protected deserialize(value: any): any {
        if (deserialize) {
          return deserialize.apply(this, value);
        }
        else {
          return super.deserialize(value);
        }
      }
    }

    const cache = new CacheableCache();
    descriptor.value = function (...args: any[]) {
      return cache.get({ scope: this, args: args });
    };
  };
}

interface CacheableParams {
  cacheId?: string;
  options?: CacheOptions;
  keyToString?: (...args: any[]) => string;
  serialize?: (value: any) => any;
  deserialize?: (value: any) => any;
}

interface CacheableKey {
  scope: any;
  args: any[];
}
