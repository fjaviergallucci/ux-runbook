#!/usr/bin/env node
// page: the decision page, the one screen put in front of the founder at a gate. It opens with the identity
// line (design · kind · size · stage n of m), then shows the options as pictures, the gallery when there is
// one, one line per seat, the findings that stayed open when there are any, one recommendation with one
// sentence of reason, and, last, one question. One artefact per review, one question: data asking two
// questions does not build.
// The page is one self-contained file: its styles inline, a light and a dark set, no script, nothing
// fetched but the pictures, which it references by the relative paths the data gives, as written. Each
// picture is shown whole, never cropped, and no wider than it is: the options are stacked, so a phone-width
// picture keeps its own width wherever the page holds it, and each picture links to its file.
//
// As a module: validateDecision(data) → every error, [] when valid · renderDecision(data) → the page, as a
// string; pure, the same data gives the same bytes.
// As a command: see USAGE. Exit codes: 0 success · 1 invalid data, an unreadable input or an unwritable
// output · 2 bad usage.
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { Markup, html } from './lib/html.mjs';
import { JsonFileError, readJsonFile, reason } from './lib/json-file.mjs';

// ---- the data

// Every key the data knows, at each level. An unknown key is refused, so a misspelt part is told, not lost.
const KEYS = Object.freeze({
  decision: ['identity', 'options', 'gallery', 'seats', 'findings', 'recommendation', 'question'],
  identity: ['design', 'kind', 'size', 'stage', 'of'],
  option: ['letter', 'title', 'line', 'images'],
  gallery: ['title', 'items'],
  item: ['title', 'line', 'images'],
  seat: ['seat', 'line', 'option'],
  finding: ['seat', 'line'],
  recommendation: ['option', 'reason'],
});
const LETTER = /^[A-Z]$/;
// A question mark in any of its forms: ?, the full-width one and the Arabic one. The Spanish opening mark
// is not one: "\u00bfCu\u00e1l?" is one question.
const QUESTION_MARKS = /[?\uFF1F\u061F]/g;
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
// A browser reads # as the start of a fragment, ? of a query and % of an escape: a path holding one names
// one file on the disk and another to the page.
const ADDRESS_MARKS = /[#?%]/;

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
    const said = new Map();
    data.seats.forEach((seat, i) => checkSeat(seat, `seats[${i}]`, letters, said, fail));
  }
  if (Object.hasOwn(data, 'findings') && need(data, 'findings', Array.isArray, 'a list of findings, each a seat and a line', at, fail)) {
    data.findings.forEach((finding, i) => checkFinding(finding, `findings[${i}]`, fail));
  }
  if (need(data, 'recommendation', isObject, 'an object', at, fail)) checkRecommendation(data.recommendation, letters, fail);
  if (need(data, 'question', isText, TEXT, at, fail)) {
    const marks = data.question.match(QUESTION_MARKS)?.length ?? 0;
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
    holder.images.forEach((image, i) => {
      if (!isPicture(image)) fail(`${at}.images[${i}]`, `must be ${PICTURE}; it is ${show(image)}`);
      else if (ADDRESS_MARKS.test(image)) {
        fail(`${at}.images[${i}]`, `a picture path cannot hold "#", "?" or "%": a browser reads them as part of an address, so it would not find the file the disk holds; it is ${show(image)}`);
      }
    });
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

// A seat says one line on each option at most, and one line on no option at most: `said` holds the first of
// each, by seat and option.
function checkSeat(seat, at, letters, said, fail) {
  if (!isObject(seat)) return fail(at, 'must be an object');
  unknownKeys(seat, KEYS.seat, at, fail);
  const named = need(seat, 'seat', isText, TEXT, at, fail);
  need(seat, 'line', isText, TEXT, at, fail);
  const on = Object.hasOwn(seat, 'option');
  if (on) names(seat, at, letters, fail);
  if (!named) return;
  const key = JSON.stringify([seat.seat, on ? seat.option : null]);
  if (said.has(key)) {
    const where = on ? `on option ${seat.option}` : 'with no option';
    fail(at, `a second line for ${JSON.stringify(seat.seat)} ${where}; the first is ${said.get(key)}`);
  } else {
    said.set(key, at);
  }
}

// A finding that stayed open: the seat that raised it, and one line.
function checkFinding(finding, at, fail) {
  if (!isObject(finding)) return fail(at, 'must be an object');
  unknownKeys(finding, KEYS.finding, at, fail);
  need(finding, 'seat', isText, TEXT, at, fail);
  need(finding, 'line', isText, TEXT, at, fail);
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
/* The options and the gallery's items are stacked, one under the other, each as wide as the page: a picture
   is then shown whole at the page's width, or at its own when that is less, and never cropped. */
.option, .item { margin: 0 0 1rem; padding: 1rem; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; }
.letter {
  display: inline-block;
  min-width: 1.75em;
  margin-right: 0.35em;
  padding: 0 0.3em;
  border: 2px solid var(--strong);
  border-radius: 4px;
  text-align: center;
}
/* Pictures side by side while they fit, each at its own width; one wider than the page shrinks to it. */
.pictures { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1rem; margin-top: 0.75rem; }
.pictures img {
  display: block;
  max-width: 100%;
  height: auto;
  background: var(--page);
  border: 1px solid var(--line);
  border-radius: 4px;
}
.seats ul, .findings ul { margin: 0; padding: 0; list-style: none; }
.seats li, .findings li { padding: 0.6rem 0; border-top: 1px solid var(--line); }
.seats li:last-child, .findings li:last-child { border-bottom: 1px solid var(--line); }
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
${data.options.map(option => drawShown(html`<span class="letter">${option.letter}</span> ${option.title}`, option, `Option ${option.letter}`, 'option'))}</section>
${drawGallery(data.gallery)}${drawSeats(data.seats)}${drawFindings(data.findings ?? [])}<section class="recommendation">
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
${gallery.items.map((item, i) => drawShown(item.title, item, `Gallery item ${i + 1}`, 'item'))}</section>
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

// The findings that stayed open after the fix round, each with the seat that raised it.
function drawFindings(findings) {
  if (findings.length === 0) return '';
  return html`<section class="findings">
<h2>Open findings</h2>
<ul>
${findings.map(finding => html`<li><strong>${finding.seat}</strong> ${finding.line}</li>\n`)}</ul>
</section>
`;
}

// ---- the command line

const USAGE = `Usage: node scripts/page.mjs <decision.json> --out <decision.html>

Builds the decision page, the one screen put in front of the founder at a gate, from a small data file
(templates/outputs/decision.json is a filled sample). The page opens with the identity line, design ·
kind · size · stage n of m; then the options as pictures, the gallery when there is one, one line per
seat, the findings that stayed open when there are any (templates/outputs/decision-approve.json), the
recommendation with one sentence of reason, and last the one question. It is one file: its styles
inline, a light and a dark set, no script; the pictures are referenced by the paths the data gives,
relative to the page, never copied, and each is shown whole and links to its file.

The data is refused, and nothing is written, when it asks more than one question (more than one
question mark in all: "?", "\uFF1F" or "\u061F"); when the reason is more than one sentence; when the
recommendation or a seat names an option that is not on the page; when an option has no letter or
shows neither a picture nor a line; when two options share a letter; when a seat says two lines on one
option, or two on none; when an open finding lacks its seat or its line; when a picture path holds "#",
"?" or "%"; when the identity lacks any of design, kind, size, stage and of; when a key is unknown; or,
the page finding its pictures from its own folder,
when a picture it names is not a file in the folder of --out.

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

// The first picture, in the order of the page, that is not a file in the page's folder, as an error; none
// when every one is there. The page refers to its pictures from its own folder, so they are found from it.
function missingPicture(data, folder) {
  const shown = [...data.options.map((option, i) => [`options[${i}]`, option]), ...(data.gallery?.items ?? []).map((item, i) => [`gallery.items[${i}]`, item])];
  for (const [at, holder] of shown) {
    for (const [i, image] of (holder.images ?? []).entries()) {
      if (!isFile(join(folder, image))) return `${at}.images[${i}]: the picture ${JSON.stringify(image)} is not a file in ${folder}`;
    }
  }
  return null;
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function build({ path, out }) {
  if (sameFile(out, path)) throw new UsageError('--out is the decision data itself: building would overwrite it');
  const data = readJsonFile(path);
  const errors = validateDecision(data);
  if (errors.length) throw new Failure(`cannot build the decision page from ${path}:\n${errors.join('\n')}`);
  const missing = missingPicture(data, dirname(out));
  if (missing) throw new Failure(`cannot build the decision page from ${path}:\n${missing}`);
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
  const findings = data.findings?.length ? `, ${plural(data.findings.length, 'open finding')}` : '';
  process.stdout.write(`built ${out}: ${plural(data.options.length, 'option')}${gallery}, ${plural(data.seats.length, 'seat')}${findings}, one question\n`);
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
    } else if (e instanceof Failure || e instanceof JsonFileError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) main(process.argv.slice(2));
