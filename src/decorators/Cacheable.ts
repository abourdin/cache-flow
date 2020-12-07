import { CacheOptions } from '../BaseCacheLoader';
import { CacheableLoader } from '../CacheableLoader';

export function Cacheable({ cacheId, options: { expirationTime, maxSize } = {}, keyToString, serialize, deserialize }: CacheableParams = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (descriptor === undefined) {
      descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
    }
    const className = target.constructor?.name || target.name;
    const resolvedCacheId = cacheId || `${className}#${propertyKey}`;
    const originalMethod = descriptor.value;

    class CacheableCache extends CacheableLoader<CacheableKey, any> {
      constructor() {
        super(resolvedCacheId, {
          expirationTime: expirationTime || 3600,
          maxSize: maxSize || 1000
        });
      }

      protected async load(key: CacheableKey): Promise<any> {
        return originalMethod.apply(key.scope, key.args);
      }

      protected keyToString(key: CacheableKey): string {
        let str;
        if (keyToString) {
          str = keyToString(...key.args);
        }
        else {
          str = key.args.map(element => {
            let elementString;
            let type = typeof element;
            if (type === 'object') {
              elementString = JSON.stringify(element);
            }
            else if (type === 'string' || type === 'number' || type === 'boolean' || type === 'undefined' || type === 'bigint') {
              elementString = element;
            }
            else {
              throw new Error(`Unsupported cache key element type: ${element} has type ${type}`);
            }
            return elementString;
          }).join('-');
        }
        return str;
      }

      protected serialize(value: any): any {
        if (serialize) {
          return serialize.call(this, value);
        }
        else {
          return super.serialize(value);
        }
      }

      protected deserialize(value: any): any {
        if (deserialize) {
          return deserialize.call(this, value);
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

export interface CacheableParams {
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
