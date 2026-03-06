/**
 * Centralized type guards to eliminate repetitive logic and improper assertions.
 */

/**
 * Checks if a value is a plain object and not null.
 */
export function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

/**
 * Checks if a value is a string.
 */
export function isString(val: unknown): val is string {
  return typeof val === 'string';
}

/**
 * Checks if a value is a number and not NaN.
 */
export function isNumber(val: unknown): val is number {
  return typeof val === 'number' && !isNaN(val);
}

/**
 * Checks if an object has a specific property of a specific type.
 */
export function hasProperty<T extends string>(
  obj: unknown,
  prop: T,
): obj is Record<T, unknown> {
  return isObject(obj) && prop in obj;
}

/**
 * Checks if an object has a string property.
 */
export function hasStringProperty<T extends string>(
  obj: unknown,
  prop: T,
): obj is Record<T, string> {
  return hasProperty(obj, prop) && isString(obj[prop]);
}
