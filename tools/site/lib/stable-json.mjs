/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Deterministic JSON serialization (sorted keys, fixed indentation, trailing newline).
 */

function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])])
    );
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(sortKeys(value), null, 2) + '\n';
}
