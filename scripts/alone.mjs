#!/usr/bin/env node
// alone: proves that a folder stands alone. A folder that is handed to someone who gets nothing else (a
// handoff folder) must load nothing from outside itself: every address its pages and stylesheets load has
// to lead to a file inside it. A page copied from elsewhere keeps the links it was written with, and a link
// that still resolves on this disk fails nowhere but here.
//
// It reads every .html and .css file under the folder, lists every address they load, and judges each: one
// that leaves the folder, is remote or leads to no file is a fault. It reads text and the file system only:
// it opens no browser and writes nothing. What it prints of an address is its path: never its query, its
// fragment or a sign-in written into it, since a key may ride there.
//
// An address is not the only way out. With --package it also proves that nothing in the folder points back
// into the package it is in: every text file of the folder, its Markdown, its JSON, its scripts and the
// comments of its pages and stylesheets among them, is read for the name of a file or a folder of the package
// that the folder does not hold itself. The package's build/ folder is the builder's place, beside the
// folder, and may be named. A pointer that names no file ("answer 28") is not seen. A symbolic link in the
// folder is never followed: one that leads out of the folder, or nowhere, is a way out too, and is printed.
//
// As a module: references(text, kind) → the addresses a page ('html') or a stylesheet ('css') loads, in the
// order written, each once, as written; alone(folder) → { files, references, faults: [{ file, reference,
// why }] }, each reference as it is printed, which throws an AloneError for a folder that cannot be read or
// holds nothing to read; pointers(folder, package) → { files, faults: [{ file, line, name, where, of }],
// links: [{ file, why }] }, the text files read, each place that names something of the package, and each
// link of the folder that leads out of it or nowhere, which throws an AloneError for a folder or a package
// that cannot be read.
// Exit codes: 0 every reference leads to a file inside the folder · 1 one does not, or a refusal · 2 bad
// usage. With --package, 1 also when a place points back, or a link leads out of the folder or nowhere.
import { lstatSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
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

// What is taken out of a text keeps its length, as spaces, so that what follows it stays where it was.
const blank = text => ' '.repeat(text.length);
// What a comment holds is not loaded: it is passed over, in a page and in a stylesheet.
const withoutHtmlComments = text => text.replace(/<!--[^]*?-->/g, blank);
const withoutCssComments = text => text.replace(/\/\*[^]*?\*\//g, blank);

// A script or a style element, whole: what it holds is its own text, and no tag of the page.
const RAW = /<(script|style)\b((?:[^>"']|"[^"]*"|'[^']*')*)>([^]*?)<\/\1\s*>/gi;
// A tag, from its `<` to its `>`, as its name and its attributes: a `>` inside a quoted value does not end it.
const TAG = /<([a-zA-Z][^\s/>]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
// One attribute after another, each with its value, however it is quoted: so that what a value holds is
// never read as an attribute of its own.
const ATTRIBUTE = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
// The attributes that are a list of candidates, and those that load one file. `data` loads on an object only.
const CANDIDATES = Object.freeze(['srcset', 'imagesrcset']);
const LINKS = Object.freeze(['href', 'xlink:href']);
const LOADS = Object.freeze(['src', 'poster']);
// url(…), quoted or not, and an @import that names its file as a string. An @import written with url() is
// found as a url().
const URL_IN_CSS = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s"']*))\s*\)/gi;
const IMPORT_IN_CSS = /@import\s+(?:"([^"]*)"|'([^']*)')/gi;
// An image-set(, with or without a prefix, and each string in it, with the function it is the argument of
// when it is one: a string of its own is an address, and the string of a url() or of a type() is not read
// here. Every string is taken whole, so that the end of one is never read as the start of another.
const IMAGE_SET = /image-set\(/gi;
const STRING_IN_SET = /([\w-]+\(\s*)?(?:"([^"]*)"|'([^']*)')/g;
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

// What a stylesheet's text loads, each with where it is written. Its comments are passed over.
function inCss(written) {
  const text = withoutCssComments(written);
  const found = [
    ...[...text.matchAll(URL_IN_CSS)].map(match => ({ at: match.index, address: match[1] ?? match[2] ?? match[3] })),
    ...[...text.matchAll(IMPORT_IN_CSS)].map(match => ({ at: match.index, address: match[1] ?? match[2] })),
  ];
  for (const set of text.matchAll(IMAGE_SET)) {
    // To the parenthesis that closes it, or to the end when none does.
    const from = set.index + set[0].length;
    let to = from;
    for (let depth = 1; to < text.length && depth > 0; to++) {
      if (text[to] === '(') depth++;
      else if (text[to] === ')' && --depth === 0) break;
    }
    for (const string of text.slice(from, to).matchAll(STRING_IN_SET)) if (string[1] === undefined) found.push({ at: from + string.index, address: string[2] ?? string[3] });
  }
  return found;
}

// What a page's text loads, each with where it is written, whether it is a link (an href, which may lead to a
// folder) and whether it is the page's base address. A stylesheet written in the page is read as one: each
// style element, and each style attribute once its character references are read. The attributes are read
// tag by tag, and what a script or a style element holds is no tag.
function inHtml(written) {
  const found = [];
  const text = withoutHtmlComments(written).replace(RAW, (whole, name, attributes, body, at) => {
    const opening = `<${name}${attributes}>`;
    if (name.toLowerCase() === 'style') for (const { at: inside, address } of inCss(body)) found.push({ at: at + opening.length + inside, address });
    return `${opening}${blank(body)}${whole.slice(opening.length + body.length)}`;
  });
  for (const tag of text.matchAll(TAG)) {
    const name = tag[1].toLowerCase();
    for (const attribute of tag[2].matchAll(ATTRIBUTE)) {
      const written = attribute[2] ?? attribute[3] ?? attribute[4];
      if (written === undefined) continue;
      const key = attribute[1].toLowerCase();
      const value = decoded(written);
      const at = tag.index + 1 + tag[1].length + attribute.index;
      // Where it is written inside the value orders the addresses of one attribute, and no further.
      if (key === 'style') for (const { at: inside, address } of inCss(value)) found.push({ at: at + inside / (value.length + 1), address });
      else if (CANDIDATES.includes(key)) for (const address of candidates(value)) found.push({ at, address });
      else if (LINKS.includes(key)) found.push({ at, address: value.trim(), link: true, base: name === 'base' });
      else if (LOADS.includes(key) || (key === 'data' && name === 'object')) found.push({ at, address: value.trim() });
    }
  }
  return found;
}

const READERS = Object.freeze({ html: inHtml, css: inCss });

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

// What is passed over: an empty address, a fragment and a query alone (the page itself), and an address that
// loads no file.
const PASSED = /^(?:$|[#?]|data:|mailto:|tel:|sms:)/i;
const CLIMBS = 'it leaves the folder: ".." climbs above it';
// A sign-in written into an address, before its host: `//name:word@`.
const SIGN_IN = /^((?:[a-z][a-z0-9+.-]*:)?\/\/)[^/?#@]*@/i;

// An address as it is printed: its path, with in words what was taken off it. A query, a fragment and a
// sign-in are never printed: a key may ride in any of them.
function shown(address) {
  const off = [/^[^#]*\?/.test(address) ? 'with a query' : null, SIGN_IN.test(address) ? 'a sign-in taken out' : null].filter(Boolean);
  return `${address.replace(SIGN_IN, '$1').replace(/[?#][^]*$/, '')}${off.length ? ` (${off.join(', ')})` : ''}`;
}

// Why an address written in `file` (its path from the folder, with `/`) does not lead to a file inside the
// folder, or null when it does. `real` is the folder's own path, every link followed; `link`: the address is
// an href, which may lead to a folder.
function fault(address, file, folder, real, link) {
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
  // A link may lead to a folder of the folder; nothing loads one.
  if (stat.isDirectory() ? !link : !stat.isFile()) return `the file is not there: it is ${stat.isDirectory() ? 'a folder' : 'not a file'}`;
  const leads = realpathSync(target);
  return leads === real || leads.startsWith(`${real}${sep}`) ? null : 'it leaves the folder: a link that leads out of it';
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
// `reference` is the address as it is printed (see shown): two of one file that print alike are one fault.
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
  const said = new Set();
  let judged = 0;
  for (const file of files) {
    for (const { address, base, link } of listed(readFileSync(join(folder, ...file.split('/')), 'utf8'), kindOf(file))) {
      if (!base && PASSED.test(address)) continue;
      judged++;
      const why = base ? 'a base address moves every link of the page: take it out' : fault(address, file, folder, real, link === true);
      const reference = shown(address);
      if (!why || said.has(`${file}\n${reference}\n${why}`)) continue;
      said.add(`${file}\n${reference}\n${why}`);
      faults.push({ file, reference, why });
    }
  }
  return { files: files.length, references: judged, faults };
}

// ---- what points back into the package

// The package's folder that is the builder's place, beside the handoff folder: it may be named.
const BUILDERS = 'build';
const isSlash = char => char === '/' || char === '\\';
const IN_A_NAME = /[A-Za-z0-9_-]/;

// A folder that can be read, or an AloneError.
function mustBeFolder(folder, what) {
  if (typeof folder !== 'string' || folder === '') throw new TypeError(`${what} must be the path of a folder; it is ${JSON.stringify(folder)}`);
  let stat;
  try {
    stat = statSync(folder);
  } catch (e) {
    throw new AloneError(`cannot read ${folder}: ${reason(e)}`);
  }
  if (!stat.isDirectory()) throw new AloneError(`cannot read ${folder}: it is a file, not a folder`);
  return realpathSync(folder);
}

// Everything under a folder, each by its path from it, with `/`: its folders, its files (`isFile`: something
// that can be read as one) and its symbolic links (`isLink`), each asked what it is itself, so that a link
// is never followed, whatever it leads to. A folder whose own path is one of `passed` is not entered and
// not listed.
function entries(folder, passed = [], inside = '') {
  return readdirSync(join(folder, ...inside.split('/')))
    .filter(name => !HIDDEN.test(name))
    .flatMap(name => {
      const path = `${inside}${name}`;
      const at = join(folder, ...path.split('/'));
      const stat = lstatSync(at);
      if (!stat.isDirectory()) return [{ path, name, isFolder: false, isFile: stat.isFile(), isLink: stat.isSymbolicLink() }];
      if (passed.includes(realpathSync(at))) return [];
      return [{ path: `${path}/`, name, isFolder: true, isFile: false, isLink: false }, ...entries(folder, passed, `${path}/`)];
    });
}

// Why a symbolic link of the folder, at this path, is a way out of it, or null when it leads to a file or a
// folder inside the folder. `real` is the folder's own path, every link followed.
function leadsOut(at, real) {
  let leads;
  try {
    leads = realpathSync(at);
  } catch {
    return 'it leads nowhere';
  }
  return leads === real || leads.startsWith(`${real}${sep}`) ? null : 'it leads out of the folder';
}

// Whether a line writes a name whole: not inside a longer name, and, for a name with no dot in it, which
// could be a word, as part of a path: a slash before it or after it.
function writes(line, name) {
  const dotted = name.includes('.');
  for (let at = line.indexOf(name); at !== -1; at = line.indexOf(name, at + 1)) {
    const before = line[at - 1] ?? '';
    const after = line[at + name.length] ?? '';
    if (IN_A_NAME.test(before) || before === '.') continue;
    if (IN_A_NAME.test(after) || (after === '.' && /[A-Za-z0-9]/.test(line[at + name.length + 1] ?? ''))) continue;
    if (dotted || isSlash(before) || isSlash(after)) return true;
  }
  return false;
}

const byCode = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// pointers(folder, package) → { files, faults, links }: how many files of the folder were read as text (one
// that holds a NUL byte is none), and each place in them that names a file or a folder of the package which
// the folder does not hold, as { file, line, name, where, of }: the file by its path from the folder, the
// line from 1, the name as it is printed (a folder's with its slash), its path in the package (the first, in
// the order of the paths, when the package holds `of` of that name). A name of the package is the name of
// anything under it but the folder itself and its build/ folder; a name the folder holds too, anywhere in
// it, is none. A symbolic link is never followed and never read: `links` holds each one of the folder that
// leads out of it or nowhere, as { file, why }, in the order of their paths; one that leads inside the
// folder is passed over, and in the package a link is a name like any other. Throws a TypeError for what is
// not a path, an AloneError for a folder that cannot be read.
export function pointers(folder, pkg) {
  const real = mustBeFolder(folder, 'folder');
  const realPackage = mustBeFolder(pkg, 'package');
  let builders = null;
  try {
    builders = realpathSync(join(realPackage, BUILDERS));
  } catch {}
  const mine = entries(folder);
  const held = new Set(mine.map(entry => entry.name));
  const names = new Map();
  for (const entry of entries(pkg, [real, builders]).sort((a, b) => byCode(a.path, b.path))) {
    if (held.has(entry.name)) continue;
    if (!names.has(entry.name)) names.set(entry.name, { shown: entry.isFolder ? `${entry.name}/` : entry.name, where: entry.path, of: 0 });
    names.get(entry.name).of += 1;
  }
  const sought = [...names].sort(([, a], [, b]) => byCode(a.shown, b.shown));
  const faults = [];
  let files = 0;
  const links = [];
  for (const { path: file, isFile, isLink } of mine.filter(entry => !entry.isFolder).sort((a, b) => byCode(a.path, b.path))) {
    const at = join(folder, ...file.split('/'));
    if (isLink) {
      const why = leadsOut(at, real);
      if (why) links.push({ file, why });
    }
    // Only a file is opened: a link is not, and nor is anything else a folder may hold.
    if (!isFile) continue;
    const bytes = readFileSync(at);
    if (bytes.includes(0)) continue;
    files++;
    bytes.toString('utf8').split('\n').forEach((line, i) => {
      for (const [name, { shown: said, where, of }] of sought) if (writes(line, name)) faults.push({ file, line: i + 1, name: said, where, of });
    });
  }
  return { files, faults, links };
}

// ---- the command line

const USAGE = `Usage: node scripts/alone.mjs <folder> [--package <package>]

Proves that a folder stands alone: that its pages and stylesheets load nothing from outside it. It reads
every .html and .css file under the folder, at any depth, and judges every address they load:

  in a tag           href and xlink:href; src and poster; srcset and imagesrcset, candidate by candidate;
                     and the data of an object. Attributes are read one after another, so an address
                     written inside another attribute's value is not read
  in a stylesheet    url(), @import, and the strings of an image-set(): in a .css file, in a style
                     element, and in a style attribute once its character references are read

No other attribute is read. What a comment holds is not, in a page or in a stylesheet, and what a script
holds is its own text. Each address must lead to a file inside the folder. One line is printed for each
that does not, on standard error, "<file>: <reference>: <why>", the file by its path from the folder:

  it leaves the folder     ".." climbs above it, however the path comes back; an absolute path; a file:
                           address; a link in the folder that leads out of it
  it is remote             http:, https:, or an address that starts with two slashes
  the file is not there    nothing is at that path, or a folder is where a file is loaded
  a base address           a <base href> moves every link of its page, so it is refused whatever it says
  an address of a kind this check does not know
                           another scheme, such as ftp: or javascript:, is printed, never guessed at

A fragment (#x), an address that is only a query (?x), and a data:, mailto:, tel: or sms: address are
passed over, and so is an empty address: none loads a file. What follows ? or # in an address is not
part of its path. A link between two pages of the folder is fine; an href may lead to a folder of the
folder; and a path with a space works, written as it is or as %20. A page is read as text: an address a
script builds as the page runs is not seen.

An address is printed without its query and its fragment, and without a sign-in written into it: a key
may ride in any of them. What was taken off is said in words, as "(with a query)".

With --package it also proves that nothing in the folder points back into its package: every file of
the folder that is text (one that holds no NUL byte: Markdown, JSON, a stylesheet and a page with their
comments, a script) is read, line by line, for the name of any file or folder of the package that the
folder does not hold. A name of the package is the name of a file or a folder anywhere under it, but in
the folder itself and in the package's build/ folder, which is the builder's place: ../build/ and the
files in it may be named. A name the folder holds too, anywhere in it, is no name of the package: it
may name its own strings.json though the package keeps another.

A name with a dot in it, as measures.md, is found wherever it is written whole, as it is written,
capitals and all: not inside a longer name (my-measures.md, measures.md.bak). A name with no dot, as
work or 06-look, could be a word: it is found only where it is written as a path, a slash before it or
after it (work/, 04-structure/board). A pointer that names no file, as "answer 28" or "as decided at
Detail", is not seen: a person still reads for those. Nor is a name written another way than the
package writes it, as my%20notes for "my notes", or anything in a file that is no text here, as one in
UTF-16. One line is printed for each place, on standard error, "<file>:<line>: <name>: it names <its
path in the package> of the package, which the folder does not hold"; of a name the package holds more
than once, the first path is given, with their number. A place that points back makes the exit code 1,
as an address that leaves the folder does.

A symbolic link in the folder is never followed, and never read as text. One that leads to a file or a
folder inside the folder is passed over: what it leads to is read at its own path. One that leads out
of the folder, or nowhere, is a way out of it: one line is printed for it, "<link>: a link: it leads out
of the folder" or "<link>: a link: it leads nowhere", and the exit code is 1. In the package a link is a
name like any other. Without --package no link is judged, but where an address leads through one.

When every address leads to a file inside the folder it prints one line, "<folder> stands alone: <n>
references in <m> files, each to a file inside it"; with --package, and no place that points back and no
link that leads out of the folder or nowhere, the line goes on: "; and none of its <k> text files names
a file or folder of <package> that it does not hold". Nothing is written, and no browser is started.

  --package <package>   the package the folder is in, as design/today for design/today/07-handoff; not
                        the folder itself, nor a folder inside it

A flag may also be written --flag=value.

Exit codes: 0 every reference leads to a file inside the folder · 1 one does not, or a refusal (a folder
that cannot be read, or one that holds no .html and no .css file) · 2 bad usage.
`;

// One folder under two paths, whichever way each is written; false when either cannot be reached.
function sameFolder(a, b) {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
}

// Whether one folder lies inside another, every link followed; false when either cannot be reached.
function liesInside(inner, outer) {
  try {
    return realpathSync(inner).startsWith(`${realpathSync(outer)}${sep}`);
  } catch {
    return false;
  }
}

function main(argv) {
  try {
    const args = parseArgs(argv, { flags: ['package'] });
    if (args.help) {
      process.stdout.write(USAGE);
      return;
    }
    if (args.positional.length !== 1) throw new UsageError('alone takes one <folder>');
    const [folder] = args.positional;
    const pkg = args.flags.package;
    if (pkg !== undefined && sameFolder(folder, pkg)) throw new UsageError('--package is the folder itself: name the package it is in');
    if (pkg !== undefined && liesInside(pkg, folder)) throw new UsageError('--package lies inside the folder: the folder comes first, then the package it is in');
    // Both are judged before anything is printed: a refusal of either is said alone.
    const { files, references: judged, faults } = alone(folder);
    const back = pkg === undefined ? null : pointers(folder, pkg);
    const places = back?.faults ?? [];
    const links = back?.links ?? [];
    if (faults.length === 0 && places.length === 0 && links.length === 0) {
      const named = back ? `; and none of its ${back.files} text file${back.files === 1 ? '' : 's'} names a file or folder of ${pkg} that it does not hold` : '';
      process.stdout.write(`${folder} stands alone: ${judged} reference${judged === 1 ? '' : 's'} in ${files} file${files === 1 ? '' : 's'}, each to a file inside it${named}\n`);
      return;
    }
    if (faults.length > 0) {
      const one = faults.length === 1;
      process.stderr.write(`${faults.map(({ file, reference, why }) => `${file}: ${reference}: ${why}\n`).join('')}${faults.length} reference${one ? '' : 's'} of ${folder} ${one ? 'does' : 'do'} not lead to a file inside it\n`);
    }
    if (links.length > 0) {
      const one = links.length === 1;
      process.stderr.write(`${links.map(({ file, why }) => `${file}: a link: ${why}\n`).join('')}${links.length} link${one ? '' : 's'} of ${folder} lead${one ? 's' : ''} out of it, or nowhere\n`);
    }
    if (places.length > 0) {
      const one = places.length === 1;
      const lines = places.map(({ file, line, name, where, of }) => `${file}:${line}: ${name}: it names ${where} of the package${of > 1 ? ` (one of ${of} of that name)` : ''}, which the folder does not hold\n`);
      process.stderr.write(`${lines.join('')}${places.length} place${one ? '' : 's'} of ${folder} name${one ? 's' : ''} a file or folder of ${pkg} that it does not hold\n`);
    }
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
