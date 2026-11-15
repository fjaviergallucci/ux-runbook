// The command line, read the same way by every script of the kit: positionals, and flags written
// `--flag value` or `--flag=value`. A flag never takes another flag as its value, is never given twice, and
// is refused when the script does not know it. A switch is a flag with no value: `--switch`, never
// `--switch=value`. `--help` or `-h` asks for help.
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const HELP = Object.freeze(['--help', '-h']);

// Bad usage: the script prints the message and its usage, and exits 2.
export class UsageError extends Error {}

// parseArgs(argv, { flags, switches }) → { help: true } when help is asked for before any fault, or else
// { help: false, positional, flags } with each flag's value as written, and true for each switch given.
// `flags` names the flags the script knows, `switches` the switches. Throws a UsageError.
export function parseArgs(argv, { flags: known = [], switches = [] } = {}) {
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
    const isSwitch = switches.includes(name);
    if (!isSwitch && !known.includes(name)) throw new UsageError(`unknown flag --${name}`);
    if (Object.hasOwn(flags, name)) throw new UsageError(`--${name} is given twice`);
    if (isSwitch) {
      if (eq !== -1) throw new UsageError(`--${name} takes no value`);
      flags[name] = true;
      continue;
    }
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined || value === '') throw new UsageError(`--${name} needs a value`);
    if (value.startsWith('--') || HELP.includes(value)) throw new UsageError(`--${name} needs a value; "${value}" is a flag`);
    flags[name] = value;
  }
  return { help: false, positional, flags };
}

// The longest a timer can wait, in milliseconds: 2^31 - 1. One longer fires at once.
export const MAX_TIMEOUT = 2_147_483_647;

// readTimeout(flags) → the --timeout a command line gives, a whole number of milliseconds from 1 to
// MAX_TIMEOUT, or undefined when it gives none (the script's own default then holds). Throws a UsageError.
export function readTimeout(flags) {
  if (!Object.hasOwn(flags, 'timeout')) return undefined;
  if (!/^[1-9]\d*$/.test(flags.timeout) || !Number.isSafeInteger(Number(flags.timeout))) {
    throw new UsageError(`--timeout must be a whole number of milliseconds from 1, as 30000; it is "${flags.timeout}"`);
  }
  if (Number(flags.timeout) > MAX_TIMEOUT) {
    throw new UsageError(`--timeout must be at most ${MAX_TIMEOUT} milliseconds, the longest a timer can wait; it is "${flags.timeout}"`);
  }
  return Number(flags.timeout);
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
