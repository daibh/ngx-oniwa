export function isDefined<T>(obj: T): obj is T {
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