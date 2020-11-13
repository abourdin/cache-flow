import { Cache, CacheOptions } from './Cache';

/**
 * Cache implementation enabling storage of any objects.
 */
export abstract class SimpleCache<K extends Object, V extends any> extends Cache<K, V> {
  /**
   * Constructor.
   *
   * @Override
   */
  protected constructor(cacheId: string, options: CacheOptions) {
    super(cacheId, options);
    this.addMetadata({
      type: 'SimpleCache'
    });
  }

  serialize(value: V): any {
    let serializedValue;
    if (typeof value === 'object' || Array.isArray(value)) {
      serializedValue = { format: 'JSON', value: JSON.stringify(value) };
    }
    else {
      serializedValue = value;
    }
    return serializedValue;
  }

  deserialize(value: any): V {
    let unserializedValue;
    if (value && value.format === 'JSON') {
      unserializedValue = JSON.parse(value.value);
    }
    else {
      unserializedValue = value;
    }
    return unserializedValue;
  }
}
