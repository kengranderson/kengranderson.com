/**
 * Author: Claude Code for Ken Granderson
 * Owner: Ken Granderson
 * Last Updated: 2026-10-26
 * Purpose: Console reporting shared by the command-line entry points.
 */

export function printProblems({ errors, warnings }) {
  for (const w of warnings) {
    console.warn(`warning  ${w.file}: ${w.message}`);
  }
  for (const e of errors) {
    console.error(`ERROR    ${e.file}: ${e.message}`);
  }
}
