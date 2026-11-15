#!/usr/bin/env node
// alone: proves that a folder stands alone. A folder that is handed to someone who gets nothing else (a
// handoff folder) must load nothing from outside itself: every address its pages and stylesheets load has
// to lead to a file inside it. A page copied from elsewhere keeps the links it was written with, and a link
// that still resolves on this disk fails nowhere but here.
//
// It reads every .html and .css file under the folder, lists every href, src, srcset, url() and @import in
// them, and judges each: one that leaves the folder, is remote or leads to no file is a fault. It reads text
// and the file system only: it opens no browser and writes nothing.
//
// As a module: references(text, kind) → the addresses a page ('html') or a stylesheet ('css') loads, in the
// order written, each once; alone(folder) → { files, references, faults: [{ file, reference, why }] }, which
// throws an AloneError for a folder that cannot be read or holds nothing to read.
// Exit codes: 0 every reference leads to a file inside the folder · 1 one does not, or a refusal · 2 bad usage.
import { readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { join, posix, sep } from 'node:path';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { reason } from './lib/json-file.mjs';

// A refusal: a folder that cannot be read, or one with no page and no stylesheet in it.
export class AloneError extends Error {
  name = 'AloneError';
}

// No part of what a folder holds: a name a mount keeps for a file that is still open, and what a file
// browser leaves behind where it has looked.
const HIDDEN = /^(?:\.fuse_hidden.*|\.DS_Store|Thumbs\.db|desktop\.ini)$/;
// The files that are read, by their ending, whatever its case.
const KINDS = Object.freeze({ '.html': 'html', '.css': 'css' });
const kindOf = file => KINDS[/\.[^./]+$/.exec(file)?.[0].toLowerCase()] ?? null;

// ---- what a text loads

// A tag, from its `<` to its `>`: a `>` inside a quoted value does not end it.
const TAG = /<[a-zA-Z](?:[^>"']|"[^"]*"|'[^']*')*>/g;
// An attribute that loads: href (an svg's xlink:href too), src or srcset, however its value is quoted. An
// attribute whose name only ends that way, as data-src, is another attribute.
const ATTRIBUTE = /(?<![\w:-])((?:xlink:)?href|src|srcset)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;
// url(…), quoted or not, and an @import that names its file as a string. An @import written with url() is
// found as a url().
const URL_IN_CSS = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s"']*))\s*\)/gi;
const IMPORT_IN_CSS = /@import\s+(?:"([^"]*)"|'([^']*)')/gi;
// The character references an address is written with in a page.
const NAMED = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'' });
const decoded = value => value.replace(/&(?:#x([0-9a-f]+)|#(\d+)|(amp|lt|gt|quot|apos));/gi, (whole, hex, dec, name) => {
  if (name) return NAMED[name.toLowerCase()];
  const code = hex ? parseInt(hex, 16) : Number(dec);
  return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
});

// The addresses of a srcset, candidate by candidate: each is an address, which ends at white space or at a
// comma that closes it, then what describes it, to the next comma.
function candidates(value) {
  const found = [];
  let i = 0;
  while (i < value.length) {
    while (i < value.length && /[\s,]/.test(value[i])) i++;
    const from = i;
    while (i < value.length && !/\s/.test(value[i])) i++;
    const address = value.slice(from, i);
    if (address === '') break;
    found.push(address.replace(/,+$/, ''));
    if (!address.endsWith(',')) while (i < value.length && value[i] !== ',') i++;
  }
  return found;
}

// What a stylesheet's text loads, each with where it is written.
function inCss(text) {
  return [
    ...[...text.matchAll(URL_IN_CSS)].map(match => ({ at: match.index, address: match[1] ?? match[2] ?? match[3] })),
    ...[...text.matchAll(IMPORT_IN_CSS)].map(match => ({ at: match.index, address: match[1] ?? match[2] })),
  ];
}

// What a page's text loads, each with where it is written and whether it is the page's base address. The
// attributes are read in its tags; a stylesheet written in the page is read wherever it is.
function inHtml(text) {
  const found = inCss(text);
  for (const tag of text.matchAll(TAG)) {
    const base = /^<base[\s/>]/i.test(tag[0]);
    for (const match of tag[0].matchAll(ATTRIBUTE)) {
      const value = decoded(match[2] ?? match[3] ?? match[4]);
      const at = tag.index + match.index;
      if (match[1].toLowerCase() === 'srcset') for (const address of candidates(value)) found.push({ at, address });
      else found.push({ at, address: value.trim(), base: base && match[1].toLowerCase() === 'href' });
    }
  }
  return found;
}

// What a comment holds is not loaded: it is taken out before anything is read.
const READERS = Object.freeze({
  html: text => inHtml(text.replace(/<!--[^]*?-->/g, '')),
  css: text => inCss(text.replace(/\/\*[^]*?\*\//g, '')),
});

// Each address once, in the order written.
function listed(text, kind) {
  if (typeof text !== 'string') throw new TypeError(`text must be a string; it is ${JSON.stringify(text)}`);
  if (!Object.hasOwn(READERS, kind)) throw new TypeError(`kind must be html or css; it is ${JSON.stringify(kind)}`);
  const seen = new Set();
  return READERS[kind](text).sort((a, b) => a.at - b.at).filter(({ address }) => !seen.has(address) && seen.add(address));
}

// references(text, kind) → the addresses a page ('html') or a stylesheet ('css') loads, in the order
// written, each once, as written (a page's character references read). Throws a TypeError for bad input.
export function references(text, kind) {
  return listed(text, kind).map(({ address }) => address);
}

// ---- where an address leads

// What is passed over: an empty address and a fragment (the page itself), and an address that loads no file.
const PASSED = /^(?:$|#|data:|mailto:)/i;
const CLIMBS = 'it leaves the folder: ".." climbs above it';

// Why an address written in `file` (its path from the folder, with `/`) does not lead to a file inside the
// folder, or null when it does. `real` is the folder's own path, every link followed.
function fault(address, file, folder, real) {
  if (address.startsWith('//')) return 'it is remote';
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(address)?.[1].toLowerCase();
  if (scheme === 'http' || scheme === 'https') return 'it is remote';
  if (scheme === 'file') return 'it leaves the folder: a file: address';
  // One letter and a colon is a drive, not a kind of address.
  if (scheme?.length === 1 || /^[/\\]/.test(address)) return 'it leaves the folder: an absolute path';
  if (scheme) return `an address of a kind this check does not know (${scheme}:)`;
  // A path from the file's own folder: what follows ? or # is not part of it, and a \ is a / to a browser.
  let path = address.replace(/[?#][^]*$/, '').replaceAll('\\', '/');
  try {
    path = decodeURIComponent(path);
  } catch {}
  const from = posix.normalize(posix.join(posix.dirname(file), path));
  if (from === '..' || from.startsWith('../')) return CLIMBS;
  const target = join(folder, ...from.split('/'));
  let stat;
  try {
    stat = statSync(target);
  } catch {
    return 'the file is not there';
  }
  if (!stat.isFile()) return `the file is not there: it is ${stat.isDirectory() ? 'a folder' : 'not a file'}`;
  const leads = realpathSync(target);
  return leads.startsWith(`${real}${sep}`) ? null : 'it leaves the folder: a link that leads out of it';
}

// Every .html and .css file under a folder, by its path from it, with `/`, in the order of those paths.
function pages(folder, inside = '') {
  return readdirSync(join(folder, ...inside.split('/')), { withFileTypes: true })
    .filter(entry => !HIDDEN.test(entry.name))
    .flatMap(entry => (entry.isDirectory() ? pages(folder, `${inside}${entry.name}/`) : entry.isFile() && kindOf(entry.name) ? [`${inside}${entry.name}`] : []))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

// alone(folder) → { files, references, faults }: how many .html and .css files were read, how many addresses
// in them were judged (those passed over are not counted), and each that does not lead to a file inside the
// folder, as { file, reference, why }, file by file in the order of their paths and in the order written.
// Throws a TypeError for a folder that is not a path, an AloneError for one that cannot be read or holds no
// .html and no .css file.
export function alone(folder) {
  if (typeof folder !== 'string' || folder === '') throw new TypeError(`folder must be the path of a folder; it is ${JSON.stringify(folder)}`);
  let stat;
  try {
    stat = statSync(folder);
  } catch (e) {
    throw new AloneError(`cannot read ${folder}: ${reason(e)}`);
  }
  if (!stat.isDirectory()) throw new AloneError(`cannot read ${folder}: it is a file, not a folder`);
  const files = pages(folder);
  if (files.length === 0) throw new AloneError(`${folder} holds no .html and no .css file: there is nothing to read. Is it the folder that was meant?`);
  const real = realpathSync(folder);
  const faults = [];
  let judged = 0;
  for (const file of files) {
    for (const { address, base } of listed(readFileSync(join(folder, ...file.split('/')), 'utf8'), kindOf(file))) {
      if (base) {
        judged++;
        faults.push({ file, reference: address, why: 'a base address moves every link of the page: take it out' });
        continue;
      }
      if (PASSED.test(address)) continue;
      judged++;
      const why = fault(address, file, folder, real);
      if (why) faults.push({ file, reference: address, why });
    }
  }
  return { files: files.length, references: judged, faults };
}

// ---- the command line

const USAGE = `Usage: node scripts/alone.mjs <folder>

Proves that a folder stands alone: that its pages and stylesheets load nothing from outside it. It reads
every .html and .css file under the folder, at any depth, and judges every address they load: each href
(an svg's xlink:href too), src and srcset of a tag, and each url() and @import of a stylesheet, in a .css
file or written in a page. No other attribute is read, and what a comment holds is not. Each address must
lead to a file inside the folder. One line is printed for each that does not, on standard error,
"<file>: <reference>: <why>", the file by its path from the folder:

  it leaves the folder     ".." climbs above it, however the path comes back; an absolute path; a file:
                           address; a link in the folder that leads out of it
  it is remote             http:, https:, or an address that starts with two slashes
  the file is not there    nothing is at that path, or a folder is
  a base address           a <base href> moves every link of its page, so it is refused whatever it says
  an address of a kind this check does not know
                           another scheme, such as ftp: or javascript:, is printed, never guessed at

A fragment (#x), a data: address and a mailto: address are passed over, and so is an empty address: none
loads a file. What follows ? or # in an address is not part of its path. A link between two pages of the
folder is fine, and a path with a space works, written as it is or as %20. A page is read as text: an
address a script builds as the page runs is not seen.

When every address leads to a file inside the folder it prints one line, "<folder> stands alone: <n>
references in <m> files, each to a file inside it". Nothing is written, and no browser is started.

Exit codes: 0 every reference leads to a file inside the folder · 1 one does not, or a refusal (a folder
that cannot be read, or one that holds no .html and no .css file) · 2 bad usage.
`;

function main(argv) {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      process.stdout.write(USAGE);
      return;
    }
    if (args.positional.length !== 1) throw new UsageError('alone takes one <folder>');
    const [folder] = args.positional;
    const { files, references: judged, faults } = alone(folder);
    if (faults.length === 0) {
      process.stdout.write(`${folder} stands alone: ${judged} reference${judged === 1 ? '' : 's'} in ${files} file${files === 1 ? '' : 's'}, each to a file inside it\n`);
      return;
    }
    const one = faults.length === 1;
    process.stderr.write(`${faults.map(({ file, reference, why }) => `${file}: ${reference}: ${why}\n`).join('')}${faults.length} reference${one ? '' : 's'} of ${folder} ${one ? 'does' : 'do'} not lead to a file inside it\n`);
    process.exitCode = 1;
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof AloneError) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
if (isMain(import.meta.url)) main(process.argv.slice(2));
