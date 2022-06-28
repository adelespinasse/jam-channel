// Creates an array of size `size` from the results of calling func(index) on
// each index of the array.
export function rangeMap<T>(size: number, func: (index: number) => T): Array<T> {
  const result = new Array<T>(size);
  for (let index = 0; index < size; index++) {
    result[index] = func(index);
  }
  return result;
}
