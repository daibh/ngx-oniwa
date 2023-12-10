export function isDefined<T>(obj: T): obj is NonNullable<T> {
  return typeof obj !== 'undefined' && obj !== null;
}

export function equals(first: string, second: string, ignoreCase?: boolean): boolean {
  const isDefinedFirst = isDefined(first);
  const isDefinedSecond = isDefined(second);

  if (!isDefinedFirst && !isDefinedSecond) {
    return true;
  }

  if (!isDefinedFirst || !isDefinedSecond) {
    return false;
  }

  if (!ignoreCase) {
    return first.localeCompare(second) === 0;
  }

  return first.localeCompare(second, undefined, { sensitivity: 'base' }) === 0
}

export function withFallback<T extends { [key: string | number | symbol]: unknown }, V>(target: T | null | undefined, key: keyof T, fallback: NonNullable<T>): V {
  if (!isDefined(target) || !isDefined(target[key])) {
    return fallback[key] as V;
  }

  return target[key] as V;
}