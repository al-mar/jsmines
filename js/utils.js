/**
 * Replicates a string.
 * @param {string} str A string to replicate.
 * @param {number} n How many times to repeat the string.
 * @returns {string}
 */
function replicate(str, n) {
  return Array(n+1).join(str);
}

/**
 * Creates a new array and fills it with default values.
 * @param {number} size The size of a new array.
 * @param {any} defaultValue An initial value for all the elements of a new array.
 * @returns {any[]}
 */
function newArray(size, defaultValue) {
  for (var result = []; size--; result.push(defaultValue));
  return result;
}

/**
 * Copies properties from one object to another.
 * @param {object} dest A destination object.
 * @param {object} src A source object.
 */
function extend(dest, src) {
  if (!src)
    return dest;

  if (!dest) dest = {};

  for (var name in src) {
    if (src.hasOwnProperty(name))
      dest[name] = src[name];
  }

  return dest;
}

/**
 * Adds a leading zero for a number.
 * @param {number} num A 1 or 2-digit positive number.
 */
function pad2(num) {
    return (num < 10 ? '0' : '') + ~~num;
}
