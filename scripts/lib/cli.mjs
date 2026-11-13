// The command line, read the same way by every script of the kit: positionals, and flags written
// `--flag value` or `--flag=value`. A flag never takes another flag as its value, is never given twice, and
// is refused when the script does not know it. `--help` or `-h` asks for help.
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const HELP = Object.freeze(['--help', '-h']);

// Bad usage: the script prints the message and its usage, and exits 2.
export class UsageError extends Error {}

// parseArgs(argv, { flags }) → { help: true } when help is asked for before any fault, or else
// { help: false, positional, flags } with each flag's value as written. `flags` names the flags the script
// knows. Throws a UsageError.
export function parseArgs(argv, { flags: known = [] } = {}) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (HELP.includes(arg)) return { help: true };
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const eq = arg.indexOf('=');
    const name = arg.slice(2, eq === -1 ? undefined : eq);
    if (!known.includes(name)) throw new UsageError(`unknown flag --${name}`);
    if (Object.hasOwn(flags, name)) throw new UsageError(`--${name} is given twice`);
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined || value === '') throw new UsageError(`--${name} needs a value`);
    if (value.startsWith('--') || HELP.includes(value)) throw new UsageError(`--${name} needs a value; "${value}" is a flag`);
    flags[name] = value;
  }
  return { help: false, positional, flags };
}

// isMain(import.meta.url) → true only in the file node was given (through a link too), never in a file it
// imports: a script runs its command only then.
export function isMain(url) {
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(url);
  } catch {
    return false;
  }
}
