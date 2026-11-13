#!/usr/bin/env node
// page: the decision page, the one screen put in front of the founder at a gate. It opens with the identity
// line (design · kind · size · stage n of m), then shows the options as pictures, the gallery when there is
// one, one line per seat, one recommendation with one sentence of reason, and, last, one question. One
// artefact per review, one question: data asking two questions does not build.
// The page is one self-contained file: its styles inline, a light and a dark set, no script, nothing
// fetched but the pictures, which it references by the relative paths the data gives, as written.
//
// As a module: validateDecision(data) → every error, [] when valid · renderDecision(data) → the page, as a
// string; pure, the same data gives the same bytes.
// As a command: see USAGE. Exit codes: 0 success · 1 invalid data, an unreadable input or an unwritable
// output · 2 bad usage.
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { Markup, html } from './lib/html.mjs';
import { ProposalFileError, readProposalFile, reason } from './lib/proposal-file.mjs';

// ---- the data

// Every key the data knows, at each level. An unknown key is refused, so a misspelt part is told, not lost.
const KEYS = Object.freeze({
  decision: ['identity', 'options', 'gallery', 'seats', 'recommendation', 'question'],
  identity: ['design', 'kind', 'size', 'stage', 'of'],
  option: ['letter', 'title', 'line', 'images'],
  gallery: ['title', 'items'],
  item: ['title', 'line', 'images'],
  seat: ['seat', 'line', 'option'],
  recommendation: ['option', 'reason'],
});
const LETTER = /^[A-Z]$/;
// A second sentence begins where a full stop, an exclamation or a question mark is followed by space and
// then a capital letter or a digit.
const SECOND_SENTENCE = /[.!?]\s+[\p{Lu}\p{Nd}]/u;
// A picture is a relative path: not absolute (/ or \), no scheme (https:, data:, javascript:, and a drive
// such as C:, which reads as one), and no control character or edge space, which a browser drops from an
// address before reading its scheme.
const ABSOLUTE = /^[/\\]/;
const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const CONTROL = /[\u0000-\u001f\u007f]/;
const isPicture = v => typeof v === 'string' && v.trim() === v && v !== '' && !CONTROL.test(v) && !ABSOLUTE.test(v) && !SCHEME.test(v);

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = v => typeof v === 'string' && v.trim() !== '';
const isCount = v => Number.isSafeInteger(v) && v >= 1;
const show = v => {
  const s = JSON.stringify(v) ?? String(v);
  return s.length > 40 ? `${s.slice(0, 37)}...` : s;
};
const TEXT = 'a line of text';
const COUNT = 'a whole number from 1';
const PICTURE = 'a relative path to a picture, as shots/A-1280-light.png';

// validateDecision(data) → every error, in the order of the page; [] when it is valid. Each error starts
// with the path of the object at fault: `options[1]: letter "A" is already options[0]`. What names an
// option (the recommendation, a seat) is checked only against options that are all valid, so one fault
// is said once.
export function validateDecision(data) {
  const errors = [];
  const fail = (path, message) => {
    errors.push(`${path}: ${message}`);
  };
  if (!isObject(data)) return ['decision: must be an object'];
  const at = 'decision';
  unknownKeys(data, KEYS.decision, at, fail);
  if (need(data, 'identity', isObject, 'an object', at, fail)) checkIdentity(data.identity, fail);
  const letters = need(data, 'options', v => Array.isArray(v) && v.length > 0, 'a list of at least one option', at, fail) ? checkOptions(data.options, fail) : null;
  if (Object.hasOwn(data, 'gallery') && need(data, 'gallery', isObject, 'an object', at, fail)) checkGallery(data.gallery, fail);
  if (need(data, 'seats', Array.isArray, 'a list of seats, empty when no seat read', at, fail)) {
    data.seats.forEach((seat, i) => checkSeat(seat, `seats[${i}]`, letters, fail));
  }
  if (need(data, 'recommendation', isObject, 'an object', at, fail)) checkRecommendation(data.recommendation, letters, fail);
  if (need(data, 'question', isText, TEXT, at, fail)) {
    const marks = data.question.split('?').length - 1;
    if (marks > 1) fail('question', `asks more than one question (${marks} question marks): a decision page asks one question`);
  }
  return errors;
}

function checkIdentity(identity, fail) {
  const at = 'identity';
  unknownKeys(identity, KEYS.identity, at, fail);
  for (const key of ['design', 'kind', 'size']) need(identity, key, isText, TEXT, at, fail);
  const stage = need(identity, 'stage', isCount, COUNT, at, fail);
  const of = need(identity, 'of', isCount, COUNT, at, fail);
  if (stage && of && identity.stage > identity.of) fail(at, `stage ${identity.stage} is beyond the last stage, ${identity.of}`);
}

// The options' letters, or null when any option is at fault.
function checkOptions(options, fail) {
  const letters = new Map();
  let valid = true;
  options.forEach((option, i) => {
    const at = `options[${i}]`;
    if (!isObject(option)) {
      valid = false;
      return fail(at, 'must be an object');
    }
    unknownKeys(option, KEYS.option, at, fail);
    if (need(option, 'letter', v => typeof v === 'string' && LETTER.test(v), 'one capital letter, A to Z', at, fail)) {
      if (letters.has(option.letter)) fail(at, `letter "${option.letter}" is already ${letters.get(option.letter)}`);
      else letters.set(option.letter, at);
    } else {
      valid = false;
    }
    checkShown(option, at, 'an option', fail);
  });
  return valid ? new Set(letters.keys()) : null;
}

// What an option or a gallery item shows: its title, and a line or a picture at least. A line or a list of
// pictures at fault is said as itself, not again as missing.
function checkShown(holder, at, what, fail) {
  need(holder, 'title', isText, TEXT, at, fail);
  maybe(holder, 'line', isText, TEXT, at, fail);
  if (maybe(holder, 'images', Array.isArray, `a list of paths, each ${PICTURE}`, at, fail)) {
    holder.images.forEach((image, i) => isPicture(image) || fail(`${at}.images[${i}]`, `must be ${PICTURE}; it is ${show(image)}`));
  }
  const noPicture = !Object.hasOwn(holder, 'images') || (Array.isArray(holder.images) && holder.images.length === 0);
  if (!Object.hasOwn(holder, 'line') && noPicture) fail(at, `has neither an image nor a line: ${what} shows one at least`);
}

function checkGallery(gallery, fail) {
  const at = 'gallery';
  unknownKeys(gallery, KEYS.gallery, at, fail);
  need(gallery, 'title', isText, TEXT, at, fail);
  if (need(gallery, 'items', v => Array.isArray(v) && v.length > 0, 'a list of at least one item', at, fail)) {
    gallery.items.forEach((item, i) => {
      const where = `${at}.items[${i}]`;
      if (!isObject(item)) return fail(where, 'must be an object');
      unknownKeys(item, KEYS.item, where, fail);
      checkShown(item, where, 'an item', fail);
    });
  }
}

function checkSeat(seat, at, letters, fail) {
  if (!isObject(seat)) return fail(at, 'must be an object');
  unknownKeys(seat, KEYS.seat, at, fail);
  need(seat, 'seat', isText, TEXT, at, fail);
  need(seat, 'line', isText, TEXT, at, fail);
  if (Object.hasOwn(seat, 'option')) names(seat, at, letters, fail);
}

function checkRecommendation(recommendation, letters, fail) {
  const at = 'recommendation';
  unknownKeys(recommendation, KEYS.recommendation, at, fail);
  if (!Object.hasOwn(recommendation, 'option')) fail(at, '"option" is missing');
  else names(recommendation, at, letters, fail);
  if (need(recommendation, 'reason', isText, TEXT, at, fail)) {
    const second = recommendation.reason.match(SECOND_SENTENCE);
    if (second) fail(at, `"reason" must be one sentence; a second begins at ${show(recommendation.reason.slice(second.index + 1).trimStart())}`);
  }
}

// An "option" names one of the options' letters; it is checked only when the options are all valid.
function names(holder, at, letters, fail) {
  if (letters && !letters.has(holder.option)) fail(at, `"option" names ${show(holder.option)}, which is no option on this page`);
}

function unknownKeys(object, allowed, at, fail) {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) fail(at, `unknown key ${show(key)}`);
  }
}

// A required key: true when it is present and `ok`.
function need(object, key, ok, what, at, fail) {
  if (!Object.hasOwn(object, key)) fail(at, `"${key}" is missing`);
  else return maybe(object, key, ok, what, at, fail);
  return false;
}

// An optional key: true when it is present and `ok`.
function maybe(object, key, ok, what, at, fail) {
  if (!Object.hasOwn(object, key)) return false;
  if (ok(object[key])) return true;
  fail(at, `"${key}" must be ${what}; it is ${show(object[key])}`);
  return false;
}

// ---- the page

// Two sets of the same few tokens, light and dark, and one plain layout: the pictures carry the options,
// so the page around them stays quiet. System fonts only; nothing is fetched.
const STYLE = `:root {
  color-scheme: light dark;
  --page: #f5f5f3;
  --surface: #ffffff;
  --ink: #1c1c1a;
  --muted: #5d5d58;
  --line: #d4d4cf;
  --strong: #1c1c1a;
}
@media (prefers-color-scheme: dark) {
  :root {
    --page: #141413;
    --surface: #1f1f1d;
    --ink: #ecece8;
    --muted: #a5a5a0;
    --line: #3b3b38;
    --strong: #ecece8;
  }
}
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0 auto;
  max-width: 84rem;
  padding: 1.5rem 1rem 3rem;
  background: var(--page);
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Liberation Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
h1.identity { margin: 0 0 1.5rem; color: var(--muted); font-size: 0.875rem; font-weight: 600; letter-spacing: 0.02em; }
h2 { margin: 2.25rem 0 0.75rem; font-size: 1.125rem; }
h3 { margin: 0 0 0.5rem; font-size: 1.0625rem; line-height: 1.35; }
p { margin: 0 0 0.5rem; }
.options h2 { margin-top: 0; }
/* auto-fill keeps every column, so a lone item stays one column wide and its picture is not blown up. */
.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 19rem), 1fr)); }
.option, .item { padding: 1rem; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; }
.letter {
  display: inline-block;
  min-width: 1.75em;
  margin-right: 0.35em;
  padding: 0 0.3em;
  border: 2px solid var(--strong);
  border-radius: 4px;
  text-align: center;
}
.pictures { display: grid; gap: 0.5rem; margin-top: 0.75rem; }
.pictures a { display: block; }
.pictures img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 32rem;
  object-fit: cover;
  object-position: top;
  background: var(--page);
  border: 1px solid var(--line);
  border-radius: 4px;
}
.seats ul { margin: 0; padding: 0; list-style: none; }
.seats li { padding: 0.6rem 0; border-top: 1px solid var(--line); }
.seats li:last-child { border-bottom: 1px solid var(--line); }
.on { display: inline-block; margin: 0 0.35em; padding: 0 0.4em; color: var(--muted); border: 1px solid var(--line); border-radius: 4px; font-size: 0.875rem; }
.pick { font-weight: 600; }
.question { margin-top: 2.5rem; padding: 1.25rem; background: var(--surface); border: 2px solid var(--strong); border-radius: 6px; }
.question h2 { margin: 0 0 0.5rem; color: var(--muted); font-size: 0.875rem; }
.question p { margin: 0; font-size: 1.375rem; font-weight: 600; line-height: 1.35; }
`;

// renderDecision(data) → one whole HTML document. Throws a TypeError, with every error, when the data is
// not valid.
export function renderDecision(data) {
  const errors = validateDecision(data);
  if (errors.length) throw new TypeError(`not a valid decision page:\n${errors.join('\n')}`);
  const { identity } = data;
  const recommended = data.options.find(option => option.letter === data.recommendation.option);
  return html`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Decision: ${identity.design}, stage ${identity.stage} of ${identity.of}</title>
<style>
${new Markup(STYLE)}</style>
</head>
<body>
<h1 class="identity">${identity.design} · ${identity.kind} · ${identity.size} · stage ${identity.stage} of ${identity.of}</h1>
<section class="options">
<h2>The options</h2>
<div class="grid">
${data.options.map(option => drawShown(html`<span class="letter">${option.letter}</span> ${option.title}`, option, `Option ${option.letter}`, 'option'))}</div>
</section>
${drawGallery(data.gallery)}${drawSeats(data.seats)}<section class="recommendation">
<h2>The recommendation</h2>
<p class="pick">Option ${recommended.letter}: ${recommended.title}</p>
<p>${data.recommendation.reason}</p>
</section>
<section class="question">
<h2>The question</h2>
<p>${data.question}</p>
</section>
</body>
</html>
`.text;
}

// An option or a gallery item: its heading, its line, and its pictures, each a link to itself at full size.
function drawShown(heading, holder, label, kind) {
  const line = Object.hasOwn(holder, 'line') ? html`<p>${holder.line}</p>\n` : '';
  const images = holder.images ?? [];
  const pictures = images.length
    ? html`<div class="pictures">\n${images.map((image, i) => html`<a href="${image}"><img src="${image}" alt="${label}, picture ${i + 1} of ${images.length}"></a>\n`)}</div>\n`
    : '';
  return html`<article class="${kind}">\n<h3>${heading}</h3>\n${line}${pictures}</article>\n`;
}

function drawGallery(gallery) {
  if (!gallery) return '';
  return html`<section class="gallery">
<h2>${gallery.title}</h2>
<div class="grid">
${gallery.items.map((item, i) => drawShown(item.title, item, `Gallery item ${i + 1}`, 'item'))}</div>
</section>
`;
}

function drawSeats(seats) {
  if (seats.length === 0) return '';
  const lines = seats.map(seat => {
    const on = Object.hasOwn(seat, 'option') ? html`<span class="on">Option ${seat.option}</span> ` : '';
    return html`<li><strong>${seat.seat}</strong> ${on}${seat.line}</li>\n`;
  });
  return html`<section class="seats">
<h2>The seats</h2>
<ul>
${lines}</ul>
</section>
`;
}

// ---- the command line

const USAGE = `Usage: node scripts/page.mjs <decision.json> --out <decision.html>

Builds the decision page, the one screen put in front of the founder at a gate, from a small data file
(templates/outputs/decision.json is a filled sample). The page opens with the identity line, design ·
kind · size · stage n of m; then the options as pictures, the gallery when there is one, one line per
seat, the recommendation with one sentence of reason, and last the one question. It is one file: its
styles inline, a light and a dark set, no script; the pictures are referenced by the paths the data
gives, relative to the page, never copied.

The data is refused, and nothing is written, when it asks more than one question (more than one "?"),
when the reason is more than one sentence, when the recommendation or a seat names an option that is not
on the page, when an option has no letter or shows neither a picture nor a line, when two options share
a letter, when the identity lacks any of design, kind, size, stage and of, or when a key is unknown.

  --out <decision.html>   the page to write, not the data itself; its folder is made when it is not
                          there

A flag may also be written --flag=value.

Exit codes: 0 success · 1 invalid data, an unreadable input or an unwritable output · 2 bad usage.
`;

// A failure the command expects and explains in one message: exit 1, without a stack.
class Failure extends Error {}

function readArgs(argv) {
  const args = parseArgs(argv, { flags: ['out'] });
  if (args.help) return args;
  const { positional, flags } = args;
  if (positional.length !== 1) throw new UsageError(`page takes one <decision.json>, got ${positional.length}`);
  if (!Object.hasOwn(flags, 'out')) throw new UsageError('--out is missing');
  return { path: positional[0], out: flags.out };
}

// One file under two paths, whichever way each is written: the same device and the same file on it.
function sameFile(a, b) {
  try {
    const [x, y] = [statSync(a, { bigint: true }), statSync(b, { bigint: true })];
    return x.dev === y.dev && x.ino === y.ino;
  } catch {
    return false;
  }
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function build({ path, out }) {
  if (sameFile(out, path)) throw new UsageError('--out is the decision data itself: building would overwrite it');
  const data = readProposalFile(path);
  const errors = validateDecision(data);
  if (errors.length) throw new Failure(`cannot build the decision page from ${path}:\n${errors.join('\n')}`);
  const page = renderDecision(data);
  try {
    // A folder that is a file is refused by the write, below, as part of the path.
    mkdirSync(dirname(out), { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw new Failure(`cannot write ${out}: ${reason(e)}`);
  }
  try {
    writeFileSync(out, page);
  } catch (e) {
    throw new Failure(`cannot write ${out}: ${reason(e)}`);
  }
  const gallery = data.gallery ? `, a gallery of ${data.gallery.items.length}` : '';
  process.stdout.write(`built ${out}: ${plural(data.options.length, 'option')}${gallery}, ${plural(data.seats.length, 'seat')}, one question\n`);
}

function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) process.stdout.write(USAGE);
    else build(args);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof Failure || e instanceof ProposalFileError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) main(process.argv.slice(2));
