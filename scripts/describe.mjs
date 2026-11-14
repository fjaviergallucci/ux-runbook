#!/usr/bin/env node
// describe: an outside text model as one more describer at Structure. The brief the other describers read
// is sent, whole and unchanged, to OpenAI or Google Gemini; when the answer is one valid proposal in the
// walkthrough format, it is written where theirs are, with "engine": "model:<provider>" and the model it
// ran on.
//
// The brief leaves the machine and a key is involved, so the script is small and strict, in this order:
//   1. the profile: an outside engine is off until the project profile's engines-on list holds
//      model:<provider>;
//   2. the usage: the model id, the address, the timeout and --out;
//   3. the brief: it must hold text;
//   4. the key: found by name, in the environment, else in the dotenv file the profile's keys-file names;
//      the command line takes neither a key nor a keys file;
//   5. the request: the key in its header only, never in the address, and no redirect followed.
// Nothing of a provider's error body is shown or kept; an answer that holds the key, as written or in JSON's
// escapes, is saved nowhere; and every string the script prints or writes passes through redact, which puts
// [key] where the key was.
//
// As a module: describe({ provider, model, briefPath, outPath, profilePath, endpoint, timeoutMs, env }) →
// { ok, heldKey, chars, seconds, errors }; baseOf(endpoint) → the address the requests go under.
// As a command: see USAGE. Exit codes: 0 a proposal is written · 1 a refusal, an answer that holds the key,
// or one that is not one valid proposal · 2 bad usage.
import dns from 'node:dns';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { UsageError, isMain, parseArgs, readTimeout } from './lib/cli.mjs';
import { FrontmatterError, parse } from './lib/frontmatter.mjs';
import { reason } from './lib/json-file.mjs';
import { validate } from './lib/walkthrough.mjs';

// A name that resolves to both, as localhost does, is tried on IPv4 first.
dns.setDefaultResultOrder('ipv4first');

// Each provider: the variable its key is found by, its address, the request and where its answer is.
const PROVIDERS = Object.freeze({
  openai: {
    variable: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com',
    path: () => '/v1/chat/completions',
    header: key => ({ authorization: `Bearer ${key}` }),
    body: (model, brief) => ({ model, messages: [{ role: 'user', content: brief }] }),
    where: 'choices[0].message.content',
    answer: body => {
      const choice = body?.choices?.[0];
      const text = choice?.message?.content;
      return { text: typeof text === 'string' ? text : '', reason: choice?.finish_reason };
    },
  },
  gemini: {
    variable: 'GEMINI_API_KEY',
    endpoint: 'https://generativelanguage.googleapis.com',
    path: model => `/v1beta/models/${model}:generateContent`,
    header: key => ({ 'x-goog-api-key': key }),
    body: (model, brief) => ({ contents: [{ parts: [{ text: brief }] }] }),
    where: 'candidates[0].content.parts[].text',
    answer: body => {
      const candidate = body?.candidates?.[0];
      const parts = candidate?.content?.parts;
      const text = Array.isArray(parts) ? parts.map(part => (typeof part?.text === 'string' ? part.text : '')).join('') : '';
      return { text, reason: candidate ? candidate.finishReason : body?.promptFeedback?.blockReason };
    },
  },
});

export const DEFAULT_TIMEOUT = 300_000;
// How many validation errors the command shows.
const SHOWN = 10;
// A model id goes into an address.
const MODEL = /^[A-Za-z0-9._-]+$/;
const LOOPBACK = Object.freeze(['127.0.0.1', 'localhost', '[::1]']);
// A key is one word of visible ASCII with no quote and no backslash: sent in a header exactly as it is, so
// that an answer or a string to print holds it, when it does, exactly as it was sent.
const KEY_TEXT = /^[\x21\x23-\x5b\x5d-\x7e]+$/;
// The reason a provider gives for an answer without text is shown only when it is a short token.
const REASON = /^[A-Za-z_]{1,40}$/;
// An error code is shown only when it looks like one.
const CODE = /^[A-Z][A-Z0-9_]{0,39}$/;

// JSON's escapes, undone over the whole of a text in one pass: what a key written with them reads as.
const ESCAPES = /\\(?:u([0-9a-fA-F]{4})|(["\\/bfnrt]))/g;
const ESCAPED = Object.freeze({ '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' });
const undoEscapes = text => text.replace(ESCAPES, (_, hex, letter) => (hex ? String.fromCharCode(parseInt(hex, 16)) : ESCAPED[letter]));
// What the command says when an answer holds the key.
export const HELD_KEY = 'the answer held the key, so nothing of it was saved: no proposal and no raw file';

// The keys this process has found, each added the moment it is found, before it is used.
const foundKeys = new Set();

// redact(text) → the text with [key] wherever a key this process found was. Every string the script prints
// or writes passes through here, and nowhere else is a key taken out of text.
function redact(text) {
  let out = String(text);
  for (const key of [...foundKeys].sort((a, b) => b.length - a.length)) out = out.split(key).join('[key]');
  return out;
}

// A refusal, said in one message that holds no key.
export class DescribeError extends Error {
  constructor(message) {
    super(redact(message));
    this.name = 'DescribeError';
  }
}

// describe(...) → { ok, heldKey, chars, seconds, errors }: whether a proposal was written to outPath, whether
// the answer held the key (and so nothing of it was saved), the characters of the answer, the seconds the
// request took, and why the answer is not one valid proposal (empty when it is, or when it held the key).
// `env` is where the key is looked up first (process.env by default). Throws a UsageError for bad usage, a
// DescribeError for a refusal.
export async function describe({ provider, model, briefPath, outPath, profilePath, endpoint, timeoutMs, env = process.env } = {}) {
  // The provider names the engine the profile must turn on, so it is known first.
  if (typeof provider !== 'string' || !Object.hasOwn(PROVIDERS, provider)) throw new UsageError('--provider must be openai or gemini');
  if (typeof profilePath !== 'string' || profilePath === '') throw new UsageError('--profile is missing');
  const spec = PROVIDERS[provider];
  // 1. The profile.
  const { keysFile } = readProfile(profilePath, provider);
  // 2. The usage.
  if (typeof model !== 'string' || !MODEL.test(model)) throw new UsageError('--model must be a model id of letters, digits, ".", "_" and "-", as gpt-4o-mini');
  const base = baseOf(endpoint ?? spec.endpoint);
  const timeout = timeoutMs ?? DEFAULT_TIMEOUT;
  if (!Number.isSafeInteger(timeout) || timeout < 1) throw new UsageError('--timeout must be a whole number of milliseconds from 1, as 30000');
  if (typeof outPath !== 'string' || !/\.json$/i.test(outPath)) throw new UsageError(`--out must name a .json file; it is ${outPath}`);
  if (typeof briefPath !== 'string' || briefPath === '') throw new UsageError('--brief is missing');
  // 3. The brief.
  const brief = readBrief(briefPath);
  // 4. The key.
  const key = findKey(env, spec.variable, provider, keysFile);
  // 5. The request.
  const headers = { 'content-type': 'application/json', ...spec.header(key) };
  const { status, text, seconds } = await ask(provider, `${base}${spec.path(model)}`, headers, JSON.stringify(spec.body(model, brief)), timeout);

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  const answer = spec.answer(body);
  if (answer.text.trim() === '') {
    const why = typeof answer.reason === 'string' && REASON.test(answer.reason) ? ` (${answer.reason})` : '';
    throw new DescribeError(`${provider} answered ${status} with no text at ${spec.where}${why}; nothing of its body is shown or kept`);
  }
  const chars = answer.text.length;
  const raw = rawOf(outPath);
  // An answer that holds the key, as written or once JSON's escapes are undone, is saved nowhere: no proposal,
  // no raw file, and none left by an earlier run. Past this, nothing the answer says can be the key.
  if (answer.text.includes(key) || undoEscapes(answer.text).includes(key)) {
    remove(outPath);
    remove(raw);
    return { ok: false, heldKey: true, chars, seconds, errors: [] };
  }
  const found = proposalIn(answer.text);
  const proposal = found.proposal && { ...found.proposal, engine: `model:${provider}`, model };
  const errors = found.proposal ? validate(proposal) : [found.error];
  if (errors.length === 0) {
    writeWhole(outPath, `${JSON.stringify(proposal, null, 2)}\n`);
    remove(raw);
    return { ok: true, heldKey: false, chars, seconds, errors };
  }
  writeWhole(raw, answer.text);
  remove(outPath);
  return { ok: false, heldKey: false, chars, seconds, errors };
}

// baseOf(endpoint) → the address the provider's paths go under: https:, or http: to this machine only;
// no user, password, query or fragment; a trailing slash dropped. The endpoint is never shown back. Throws
// a UsageError.
export function baseOf(endpoint) {
  const refuse = what => new UsageError(`--endpoint ${what}`);
  const notAnAddress = refuse('must be an address, as https://api.openai.com');
  if (typeof endpoint !== 'string') throw notAnAddress;
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw notAnAddress;
  }
  if (url.username !== '' || url.password !== '') throw refuse('must carry no user and no password');
  if (endpoint.includes('?') || endpoint.includes('#')) throw refuse('must carry no query and no fragment');
  const loopback = LOOPBACK.includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw refuse('must be an https: address, or http: to this machine only (127.0.0.1, localhost or [::1])');
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
}

const rawOf = outPath => `${outPath}.raw.txt`;
const codeOf = e => (typeof e?.code === 'string' && CODE.test(e.code) ? e.code : 'no error code');

// The profile turns the engine on, and may name the keys file: → { keysFile }, its path as the system reads
// it, or undefined.
function readProfile(profilePath, provider) {
  let data;
  try {
    ({ data } = parse(readFileSync(profilePath, 'utf8')));
  } catch (e) {
    throw new DescribeError(`cannot read the profile ${profilePath}: ${e instanceof FrontmatterError ? e.message : reason(e)}`);
  }
  const engine = `model:${provider}`;
  const on = data['engines-on'];
  if (!Array.isArray(on) || !on.includes(engine)) {
    throw new DescribeError(
      `the profile ${profilePath} does not turn ${engine} on. An outside model is sent the brief, so it stays off until the profile turns it on: add ${engine} to its engines-on list, as engines-on: [${engine}]`,
    );
  }
  const named = data['keys-file'];
  if (named === undefined || named === '') return { keysFile: undefined };
  if (typeof named !== 'string') throw new DescribeError(`cannot read the profile ${profilePath}: keys-file must be the path of one file`);
  // ~/ is the home folder; a relative path is read from the profile's folder; an absolute one as it is.
  const keysFile = named.startsWith('~/') ? join(homedir(), named.slice(2)) : resolve(dirname(resolve(profilePath)), named);
  return { keysFile };
}

function readBrief(briefPath) {
  let text;
  try {
    text = readFileSync(briefPath, 'utf8');
  } catch (e) {
    throw new DescribeError(`cannot read the brief ${briefPath}: ${reason(e)}`);
  }
  if (text.trim() === '') throw new DescribeError(`the brief ${briefPath} is empty: there is nothing to send`);
  return text;
}

// The key, by name: env[name] when it holds one, else the one line for it in the keys file. No other text
// of the file is kept, and no error shows a value or any of the file's text.
function findKey(env, name, provider, keysFile) {
  const fromEnv = typeof env[name] === 'string' ? env[name].trim() : '';
  if (fromEnv !== '') return usable(fromEnv, name, 'the environment');
  if (keysFile === undefined) throw noKey(provider, name, 'the profile names none');
  let text;
  try {
    text = readFileSync(keysFile, 'utf8');
  } catch (e) {
    throw new DescribeError(`cannot read the keys file ${keysFile}: ${codeOf(e)}`);
  }
  const fromFile = valueIn(text, name);
  if (fromFile === '') throw noKey(provider, name, `${keysFile} holds no such line`);
  return usable(fromFile, name, keysFile);
}

const noKey = (provider, name, where) =>
  new DescribeError(`no key for ${provider}: set ${name} in the environment, or write the line ${name}=<the key> in the file the profile's keys-file names (${where})`);

// The value of the one line that is exactly NAME=value or export NAME=value, the last such line, as when the
// file is sourced; one pair of matching quotes around it stripped. Every other line is passed over. An empty
// value is no value.
function valueIn(text, name) {
  const line = new RegExp(`^(?:export )?${name}=(.*)$`);
  let value = '';
  for (const each of text.split(/\r?\n/)) {
    const match = line.exec(each);
    if (match) value = unquote(match[1].trim());
  }
  return value;
}

function unquote(value) {
  const quoted = value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0];
  return quoted ? value.slice(1, -1) : value;
}

function usable(key, name, where) {
  foundKeys.add(key);
  if (!KEY_TEXT.test(key)) {
    throw new DescribeError(
      `the key in ${name}, from ${where}, holds a character no key holds (a space, a quote, a backslash, a control character or a letter beyond ASCII); write it as one word`,
    );
  }
  return key;
}

// One POST, ended at the timeout whether the answer has not begun or stops halfway. → { status, text,
// seconds } for a 2xx; a DescribeError for anything else, which never holds the body, the error's own
// words or its cause.
async function ask(provider, url, headers, body, timeout) {
  const controller = new AbortController();
  let late = false;
  const timer = setTimeout(() => {
    late = true;
    controller.abort();
  }, timeout);
  const started = performance.now();
  try {
    const response = await fetch(url, { method: 'POST', headers, body, redirect: 'error', signal: controller.signal });
    if (!response.ok) throw new DescribeError(`${provider} answered ${response.status}: ${refusedBy(response.status)}`);
    const text = await response.text();
    return { status: response.status, text, seconds: Math.round((performance.now() - started) / 100) / 10 };
  } catch (e) {
    if (e instanceof DescribeError) throw e;
    if (late) throw new DescribeError(`${provider}: no answer within ${timeout / 1000} s`);
    if (e?.cause?.message === 'unexpected redirect') {
      throw new DescribeError(`${provider} answered with a redirect, which is never followed: it would send the key on to another address`);
    }
    throw new DescribeError(`the request to ${provider} failed before any answer came: ${codeOf(e?.cause ?? e)}`);
  } finally {
    clearTimeout(timer);
    // Whatever is left of a body is never read.
    controller.abort();
  }
}

function refusedBy(status) {
  if (status === 401 || status === 403) return 'the key was refused';
  if (status === 404) return 'the model or the address was not found';
  if (status === 429) return 'the provider is limiting requests or the quota is spent';
  if (status >= 500) return 'the provider failed';
  return 'the request was refused';
}

// The answer holds one JSON object when the whole of it is one, or when it holds exactly one fenced block,
// marked json or not marked, whose content is one; prose around that block is allowed. → { proposal } or
// { error }.
function proposalIn(text) {
  const whole = objectIn(text.trim());
  if (whole) return { proposal: whole };
  const blocks = fencedBlocks(text);
  if (blocks === null) return { error: 'the answer opens a fenced block it never closes' };
  if (blocks.length === 0) return { error: 'the answer holds no JSON object: it is not one, and it holds no fenced block' };
  if (blocks.length > 1) return { error: `the answer holds ${blocks.length} fenced blocks; it must hold one JSON object, the whole answer or in one fenced block` };
  const [block] = blocks;
  if (block.info !== '' && block.info.toLowerCase() !== 'json') return { error: 'the answer’s fenced block is marked as another language, not json' };
  const proposal = objectIn(block.text);
  return proposal ? { proposal } : { error: 'the answer’s fenced block does not hold one JSON object' };
}

function objectIn(text) {
  try {
    const value = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

// The fenced blocks of a text, each { info, text }; null when one is never closed. A fence is a line of
// three backticks, after spaces or tabs; an opening one may name a language, a closing one names none.
function fencedBlocks(text) {
  const blocks = [];
  let open = null;
  for (const line of text.split(/\r?\n/)) {
    const fence = /^[ \t]*```(.*)$/.exec(line);
    if (open === null) {
      if (fence) open = { info: fence[1].trim(), lines: [] };
    } else if (fence && fence[1].trim() === '') {
      blocks.push({ info: open.info, text: open.lines.join('\n') });
      open = null;
    } else {
      open.lines.push(line);
    }
  }
  return open === null ? blocks : null;
}

// A file is written whole: into a new file beside it, renamed into place; the folders above it are made when
// missing. When it fails, nothing staged is left behind, and the failure said is the write's.
function writeWhole(path, text) {
  const staged = join(dirname(path), `.${basename(path)}.describing-${randomUUID()}`);
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(staged, redact(text));
    renameSync(staged, path);
  } catch (e) {
    try {
      rmSync(staged, { force: true });
    } catch {
      // Its folder cannot be made or read, so nothing was staged in it.
    }
    throw new DescribeError(`cannot write ${path}: ${reason(e)}`);
  }
}

function remove(path) {
  try {
    rmSync(path, { force: true });
  } catch (e) {
    throw new DescribeError(`cannot remove ${path}: ${reason(e)}`);
  }
}

const USAGE = `Usage: node scripts/describe.mjs --provider <openai|gemini> --model <id> --brief <file> --out <file.json>
         --profile <PROFILE.md> [--endpoint <url>] [--timeout <ms>]

describe sends the brief, whole and unchanged, to an outside text model as one more describer at
Structure. When the answer holds one JSON object (the whole answer, or the content of its one fenced
block) that is a valid proposal in the walkthrough format, the proposal is written to <file.json> with
"engine": "model:<provider>" and "model": "<id>". Otherwise the answer is kept as it came in
<file.json>.raw.txt and the first ${SHOWN} reasons are shown; the two never both exist after a run.

An outside engine is off unless the profile turns it on, because the brief leaves this machine: the
profile's engines-on list must hold model:openai or model:gemini, as engines-on: [model:openai].

The key is found by name, and never on the command line: OPENAI_API_KEY or GEMINI_API_KEY in the
environment, else a line NAME=<the key> or export NAME=<the key> in the dotenv file the profile's
keys-file names (an absolute path, ~/ for the home folder, or a path read from the profile's folder).
It goes in a request header only. No error body of a provider is shown or kept, no redirect is followed,
and an answer that holds the key, as written or in JSON's escapes, is saved nowhere.

  --provider <name>   openai or gemini
  --model <id>        the provider's model id: letters, digits, ".", "_" and "-"
  --brief <file>      the brief to send
  --out <file.json>   where the proposal is written; the folders above it are made when missing
  --profile <file>    the project profile
  --endpoint <url>    the provider's address, by default https://api.openai.com or
                      https://generativelanguage.googleapis.com: https:, or http: to this machine only
                      (127.0.0.1, localhost or [::1]), with no user, password, query or fragment
  --timeout <ms>      how long the whole answer may take, a whole number of milliseconds from 1
                      (default ${DEFAULT_TIMEOUT})

A flag may also be written --flag=value.

Standard output is one line, after an answer: the provider, the model, the characters of the answer and
the seconds it took; or this help, when --help asks for it. Everything else goes to standard error.

Exit codes: 0 a proposal is written · 1 a refusal (the engine off; a profile, brief or keys file that
cannot be read; no key; a provider that refuses, fails, redirects or does not answer in time; a file that
cannot be written), an answer that holds the key, or one that is not one valid proposal · 2 bad usage.
`;

const FLAGS = ['provider', 'model', 'brief', 'out', 'profile', 'endpoint', 'timeout'];
const REQUIRED = ['provider', 'model', 'brief', 'out', 'profile'];

// The command line as describe() takes it. Nothing a flag holds is shown back but a path.
function readArgs(argv) {
  const args = parseArgs(argv, { flags: FLAGS });
  if (args.help) return args;
  const { positional, flags } = args;
  if (positional.length) throw new UsageError(`describe takes no positional argument; ${positional.length} given`);
  const missing = REQUIRED.filter(name => !Object.hasOwn(flags, name)).map(name => `--${name}`);
  if (missing.length) throw new UsageError(`${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing`);
  if (!Object.hasOwn(PROVIDERS, flags.provider)) throw new UsageError('--provider must be openai or gemini');
  return {
    provider: flags.provider,
    model: flags.model,
    briefPath: flags.brief,
    outPath: flags.out,
    profilePath: flags.profile,
    endpoint: flags.endpoint,
    timeoutMs: readTimeout(flags),
  };
}

// One of the two places standard output is written: the result line.
function printResult(provider, model, chars, seconds) {
  process.stdout.write(redact(`${provider} ${model}: ${chars} characters in ${seconds.toFixed(1)} s\n`));
}

// The other: the usage, when --help asks for it.
function printUsage() {
  process.stdout.write(redact(USAGE));
}

const say = text => process.stderr.write(redact(text));

function notValid(outPath, errors) {
  const lines = [`the answer is not one valid proposal, so no proposal is written; the answer is kept as it came, in ${rawOf(outPath)}:`];
  lines.push(...errors.slice(0, SHOWN).map(error => `  ${error}`));
  if (errors.length > SHOWN) lines.push(`  ... and ${errors.length - SHOWN} more`);
  return `${lines.join('\n')}\n`;
}

async function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) {
      printUsage();
      return;
    }
    const { ok, heldKey, chars, seconds, errors } = await describe(args);
    printResult(args.provider, args.model, chars, seconds);
    if (heldKey) {
      say(`${HELD_KEY}\n`);
      process.exitCode = 1;
    } else if (!ok) {
      say(notValid(args.outPath, errors));
      process.exitCode = 1;
    }
  } catch (e) {
    if (e instanceof UsageError) {
      say(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof DescribeError) {
      say(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      // Never a stack: what an error carries is not known here.
      say(`describe stopped on an error it does not expect: ${e?.message ?? e}\n`);
      process.exitCode = 1;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) await main(process.argv.slice(2));
