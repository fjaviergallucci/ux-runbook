#!/usr/bin/env node
// render: draws one Structure proposal, written in the walkthrough format (lib/walkthrough.mjs), as one
// HTML document in the shared kit, in exactly the markup kit/KIT-CONTRACT.md states. One script draws
// every proposal, so none looks better made than another: the page depends only on what the proposal
// says. Who made it (author, engine, track, model, source) and the maker's first idea are never drawn.
// It draws either form of a proposal (lib/walkthrough.mjs): a source file, or a letter copy from the merge;
// the two draw the same page under the same letter.
// The page is drawn as a product, in this order: the option's title; the map, every screen of the proposal
// at a glance (its title, its areas and what each holds in a line, a dialog under the screen it opens
// over), drawn from the proposal alone; the screens, each in a frame whose window the kit lays out as a
// page, a region that says which area it is (`place`) carrying that area's class; and last, under its own
// heading, the proposal's own account. A screen that places no region is one column in the same window.
// A page is drawn with the proposal's own account, for the founder and the judges, or without it, for a
// reader who must not see it (an audience, who is not told what a design means to do): then its title is
// the letter alone, and no name, bet, cost, absence, hardest state or note is drawn: no account at all.
// The map and the screens are the same either way.
// A kit folder whose stylesheets style none of the classes of the page's areas (AREA_CLASSES) was made
// before them: the command says so in one warning line and draws all the same.
//
// As a module: renderProposal(proposal, { letter, notes }) → the page, as a string; `notes` is true when
// not given. Pure; the same proposal, letter and notes give the same bytes.
// As a command: see USAGE. Exit codes: 0 success · 1 an invalid proposal, an unreadable input or an
// unwritable output · 2 bad usage.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { UsageError, isMain, parseArgs } from './lib/cli.mjs';
import { html } from './lib/html.mjs';
import { ProposalFileError, REASONS, readProposalFile, reason } from './lib/json-file.mjs';
import { PLACES, SOURCE_ONLY, validate } from './lib/walkthrough.mjs';

// ---- markup

// Every string of the proposal reaches the page through html`…` (lib/html.mjs), which escapes it, in text
// and in attributes alike; no string of the proposal reaches the page another way.

// The element each role is drawn on (KIT-CONTRACT.md § The markup), and the attribute it also needs.
const ROLE_ELEMENTS = {
  heading: ['h3'],
  text: ['p'],
  choice: ['div'],
  input: ['p'],
  action: ['button', html` type="button"`],
  list: ['div'],
  status: ['p'],
  media: ['div'],
  link: ['a', html` href="#"`],
  nav: ['nav'],
};
const CONTAINER_ELEMENTS = { region: 'section', group: 'div', expansion: 'details' };
const INDENT = '  ';
const LETTER = /^[A-Z]$/;
// The classes of the page's areas, which the board is drawn with since a region may say where it is: the
// option's title, the map, a screen's window, the four areas a region may be, and the proposal's own
// account. A kit that styles none of them was made before them (KIT-CONTRACT.md § A kit made before the
// page's areas).
export const AREA_CLASSES = Object.freeze(['ux-option', 'ux-map', 'ux-window', ...PLACES.map(place => `ux-${place}`), 'ux-account']);

// A proposal is checked in the form it is written in: one carrying any of the six keys only a source has
// (firstIdea, author, engine, track, model, source) is a source, and must carry its firstIdea; one carrying
// none of them is a letter copy. Object() lets anything be asked, null too.
const check = proposal => validate(proposal, { sealed: !SOURCE_ONLY.some(key => Object.hasOwn(Object(proposal), key)) });

// ---- the drawing

// renderProposal(proposal, { letter, notes }) → a whole HTML document that links kit.css from beside it;
// with `notes` false, without the proposal's own account. Throws a TypeError when the letter is not one
// capital letter, `notes` is not true or false, or the proposal is not valid.
export function renderProposal(proposal, { letter, notes = true } = {}) {
  if (typeof letter !== 'string' || !LETTER.test(letter)) {
    throw new TypeError(`the letter must be one capital letter, A to Z; it is ${JSON.stringify(letter)}`);
  }
  if (typeof notes !== 'boolean') throw new TypeError(`notes must be true or false; it is ${JSON.stringify(notes)}`);
  const errors = check(proposal);
  if (errors.length) throw new TypeError(`not a valid proposal:\n${errors.join('\n')}`);
  const titles = new Map(proposal.screens.map(screen => [screen.id, screen.title]));
  return html`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Option ${letter}</title>
<link rel="stylesheet" href="kit.css">
</head>
<body>

${drawTitle(letter, notes ? proposal.name : null)}
${drawMap(proposal.screens)}${proposal.screens.map(screen => drawFrame(notes ? screen : unnoted(screen), titles))}${notes ? drawAccount(proposal) : ''}
</body>
</html>
`.text;
}

// The page's title: which option this is, and its name; drawn without the proposal's own account, the
// letter alone.
const drawTitle = (letter, name) => html`<header class="ux-option">
  <h1>Option ${letter}${name === null ? '' : html`: ${name}`}</h1>
</header>
`;

// ---- the map

// Every screen of the proposal at a glance, before any is drawn: each screen in the walkthrough's order,
// and under it each dialog that opens over it. It is drawn from the screens alone, and says nothing a
// frame is found by: no data-screen, no data-ux, and no note.
function drawMap(screens) {
  const dialogs = screen => screens.filter(other => other.container === 'dialog' && other.over === screen.id);
  const entry = (screen, pad) => {
    const inner = pad + INDENT;
    // A dialog opens over a screen, never over a dialog, so only a screen has any under it.
    const under = dialogs(screen);
    const list = under.length ? html`${inner}<ol>\n${under.map(dialog => entry(dialog, inner + INDENT))}${inner}</ol>\n` : '';
    return html`${pad}<li>\n${inner}<b>${screen.title}</b>\n${inner}<dl>\n${areasOf(screen).map(([area, holds]) => html`${inner}${INDENT}<dt>${area}</dt>\n${inner}${INDENT}<dd>${holds}</dd>\n`)}${inner}</dl>\n${list}${pad}</li>\n`;
  };
  return html`<section class="ux-map">
  <ol>
${screens.filter(screen => screen.container === 'screen').map(screen => entry(screen, INDENT + INDENT))}  </ol>
</section>
`;
}

// The areas of a screen as the map says them: each area it places, in the format's own order and by the
// format's own word, with what it holds; a screen that places none, and a dialog, as one area named by
// its container.
function areasOf(screen) {
  const placed = PLACES.flatMap(place => screen.items.filter(item => item.place === place));
  return placed.length ? placed.map(region => [region.place, holdsOf(region)]) : [[screen.container, holdsOf(screen)]];
}

// What a screen or a region holds, in a line: its label, when it has one, then the words of each part
// directly in it, in order. A nav is said by its places; a container by its label, and one without a
// label by what it holds.
const SEPARATOR = ' · ';
const PLACE_SEPARATOR = ', ';
const holdsOf = holder => [...(Object.hasOwn(holder, 'label') ? [holder.label] : []), ...wordsOf(holder.items)].join(SEPARATOR);
const wordsOf = items => items.flatMap(item => {
  if (Object.hasOwn(item, 'role')) return [item.role === 'nav' ? item.options.join(PLACE_SEPARATOR) : item.text];
  return Object.hasOwn(item, 'label') ? [item.label] : wordsOf(item.items);
});

// ---- the screens

// A screen, or an item, without its note, and without the notes of what it holds.
function unnoted(holder) {
  const { note, ...rest } = holder;
  return Object.hasOwn(rest, 'items') ? { ...rest, items: rest.items.map(unnoted) } : rest;
}

// One frame per screen: its caption (the title; for a dialog, the title of the screen it opens over; then
// the screen's note), then its window, which holds the screen or the dialog. The kit paints a dialog's
// window as the backdrop that stands for the screen it opens over, which has a frame of its own and is
// not drawn again here.
function drawFrame(screen, titles) {
  const over = Object.hasOwn(screen, 'over') ? html`    <p class="ux-over">opens over ${titles.get(screen.over)}</p>\n` : '';
  // Where she is, for a nav to mark: a screen's own title. A dialog is nowhere of its own.
  const here = screen.container === 'screen' ? screen.title : null;
  return html`
<section class="ux-frame" data-screen="${screen.id}">
  <header>
    <h2>${screen.title}</h2>
${over}${drawNote(screen, INDENT + INDENT)}  </header>
  <div class="ux-window">
    <div class="ux-${screen.container}">
${drawItems(screen.items, INDENT + INDENT + INDENT, here)}    </div>
  </div>
</section>
`;
}

const drawItems = (items, pad, here) => items.map(item => (Object.hasOwn(item, 'role') ? drawRole(item, pad, here) : drawContainer(item, pad, here)));

// A role is one part that holds the item's text; a choice, a list and a nav end with their options. An
// item's id goes on its part as data-ux, as written. A note on the item is the part's next sibling.
function drawRole(item, pad, here) {
  const [tag, attribute = ''] = ROLE_ELEMENTS[item.role];
  const classes = item.primary === true ? 'ux-action is-primary' : `ux-${item.role}`;
  const id = Object.hasOwn(item, 'id') ? html` data-ux="${item.id}"` : '';
  const current = item.role === 'nav' && here !== null ? currentOf(item.options, here) : -1;
  const options = Object.hasOwn(item, 'options')
    ? html`\n${pad}${INDENT}<ul>\n${item.options.map((option, i) => html`${pad}${INDENT}${INDENT}<li${i === current ? html` aria-current="page"` : ''}>${option}</li>\n`)}${pad}${INDENT}</ul>\n${pad}`
    : '';
  return html`${pad}<${tag} class="${classes}"${attribute}${id}>${item.text}${options}</${tag}>\n${drawNote(item, pad)}`;
}

// No key of the format says which place of a nav she is at, so the board reads it from what the proposal
// already says: the place whose words open the screen's title, whatever the case and the spaces ("Today"
// opens "Today, at 9:40"; "Room" does not open "Rooms"). The longest such place, the first of two alike,
// and none when the title opens with no place: -1.
const plain = text => text.trim().replace(/\s+/g, ' ').toLowerCase();
const WORD = /^[\p{L}\p{N}]/u;
function currentOf(options, title) {
  const said = plain(title);
  let current = -1;
  options.forEach((option, i) => {
    const place = plain(option);
    if (!said.startsWith(place) || WORD.test(said.slice(place.length))) return;
    if (current === -1 || place.length > plain(options[current]).length) current = i;
  });
  return current;
}

// A container is one element holding its own items. A region or a group shows its label, when it has one,
// as a header; an expansion always shows its label, as a summary, and is open only when written open. A
// region that says which area of the page it is carries that area's class beside its own.
function drawContainer(item, pad, here) {
  const tag = CONTAINER_ELEMENTS[item.container];
  const inner = pad + INDENT;
  const open = item.open === true ? html` open` : '';
  const area = Object.hasOwn(item, 'place') ? ` ux-${item.place}` : '';
  let label = '';
  if (item.container === 'expansion') label = html`${inner}<summary>${item.label}</summary>\n`;
  else if (Object.hasOwn(item, 'label')) label = html`${inner}<header>${item.label}</header>\n`;
  return html`${pad}<${tag} class="ux-${item.container}${area}"${open}>\n${label}${drawItems(item.items, inner, here)}${pad}</${tag}>\n`;
}

const drawNote = (holder, pad) => (Object.hasOwn(holder, 'note') ? html`${pad}<p class="ux-note">${holder.note}</p>\n` : '');

// ---- the proposal's own account

// What the founder judges a structure by, after its screens and never above them: its bet, what it is
// deliberately bad at, what it leaves out and how it meets its hardest state.
function drawAccount(proposal) {
  return html`
<section class="ux-account">
  <h2>Its own account</h2>
  <dl>
    <dt>Its bet</dt>
    <dd>${proposal.bet}</dd>
    <dt>Deliberately bad at</dt>
    <dd>${proposal.cost}</dd>
    <dt>Absent on purpose</dt>
    <dd>
      <ul>
${proposal.absent.map(line => html`        <li>${line}</li>\n`)}      </ul>
    </dd>
    <dt>In the hardest state</dt>
    <dd>${proposal.hardest}</dd>
  </dl>
</section>
`;
}

// ---- the command line

const USAGE = `Usage: node scripts/render.mjs <proposal.json> --kit <kit dir> --out <file.html> [--letter A] [--without-notes]

Draws one Structure proposal, written in the walkthrough format, as one HTML document in the shared kit,
and copies every stylesheet directly in <kit dir> (each .css file, kit.css among them) beside it, so a
kit.css that imports its token file keeps it. The page shows the option's letter, never who made the
proposal. It is drawn in this order: the option's title; the map (every screen at a glance: its title,
its areas and what each holds, a dialog under the screen it opens over); the screens, each in a window
the kit lays out as a page, with each region that says which area it is (navigation, bar, main, beside)
in its place, and a screen that places none as one column; and last the proposal's own account.

  --kit <kit dir>     the kit to draw in: a folder holding kit.css, and any stylesheet it imports
                      (the grey kit is kit/grey)
  --out <file.html>   the page to write: not named like one of the kit's stylesheets, and
                      not the proposal itself; its folder is made when it does not exist
  --letter <A to Z>   the option's letter on the board; A when not given
  --without-notes     draw the page without the proposal's own account (its name, its bet, its cost,
                      what is absent, its hardest state, and the note on a screen or an item), for a
                      reader who must not see it, as an audience: its heading is the option's letter
                      alone; the screens, their captions and every part are drawn as they are with it

A kit made before the page had areas styles none of their classes (ux-option, ux-map, ux-window,
ux-navigation, ux-bar, ux-main, ux-beside, ux-account). The page is then drawn all the same, without
its areas, and one warning line on the error stream says so and asks for setup's kit steps to be run
again; the exit code is not changed by it.

A flag may also be written --flag=value.

Exit codes: 0 success · 1 an invalid proposal, an unreadable input or an unwritable output · 2 bad usage.
`;
// A failure the command expects and explains in one message: exit 1, without a stack. A proposal file
// that cannot be read is one too (lib/json-file.mjs).
class Failure extends Error {}

function readArgs(argv) {
  const args = parseArgs(argv, { flags: ['kit', 'out', 'letter'], switches: ['without-notes'] });
  if (args.help) return args;
  const { positional, flags } = args;
  if (positional.length !== 1) throw new UsageError(`render takes one <proposal.json>, got ${positional.length}`);
  for (const name of ['kit', 'out']) {
    if (!Object.hasOwn(flags, name)) throw new UsageError(`--${name} is missing`);
  }
  const letter = flags.letter ?? 'A';
  if (!LETTER.test(letter)) throw new UsageError(`--letter must be one capital letter, A to Z; it is "${letter}"`);
  return { path: positional[0], kit: flags.kit, out: flags.out, letter, notes: flags['without-notes'] !== true };
}

function readInput(file) {
  try {
    return readFileSync(file);
  } catch (e) {
    throw new Failure(`cannot read ${file}: ${reason(e)}`);
  }
}

function writeOutput(file, data) {
  try {
    writeFileSync(file, data);
  } catch (e) {
    throw new Failure(`cannot write ${file}: ${reason(e)}`);
  }
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

// The kit's stylesheets: every .css file directly in its folder, by name; kit.css must be one of them.
function stylesheets(kit) {
  let names;
  try {
    names = readdirSync(kit);
  } catch (e) {
    throw new Failure(`cannot read ${kit}: ${reason(e)}`);
  }
  const sheets = names.filter(name => name.endsWith('.css') && statSync(join(kit, name)).isFile()).sort();
  if (!sheets.includes('kit.css')) throw new Failure(`cannot read ${join(kit, 'kit.css')}: ${REASONS.ENOENT}`);
  return sheets;
}

// Everything is read and checked before anything is written.
function draw({ path, kit, out, letter, notes }) {
  if (sameFile(out, path)) throw new UsageError('--out is the proposal itself: drawing would overwrite it');
  const sheets = stylesheets(kit);
  // Each stylesheet lands beside the page under its own name, on a file system that may ignore case.
  const clash = sheets.find(name => name.toLowerCase() === basename(out).toLowerCase());
  if (clash) throw new UsageError(`--out cannot be named ${basename(out)}: the kit's stylesheet ${clash} is copied there, beside the page`);
  const proposal = readProposalFile(path);
  const errors = check(proposal);
  if (errors.length) throw new Failure(`cannot draw ${path}: it is not a valid proposal\n${errors.join('\n')}`);
  const css = sheets.map(name => [name, readInput(join(kit, name))]);
  const dated = !css.some(([, data]) => stylesAnArea(data.toString('utf8')));
  const page = renderProposal(proposal, { letter, notes });
  const folder = dirname(out);
  try {
    mkdirSync(folder, { recursive: true });
  } catch (e) {
    throw new Failure(`cannot write ${folder}: ${reason(e)}`);
  }
  writeOutput(out, page);
  for (const [name, data] of css) writeOutput(join(folder, name), data);
  process.stdout.write(`drew option ${letter} to ${out},${notes ? '' : ' without the proposal\'s own account,'} with ${sheets.join(', ')} beside it\n`);
  if (dated) process.stderr.write(`warning: no stylesheet of ${kit} styles any of the page's areas (${AREA_CLASSES.join(', ')}), so the board is drawn without them: this kit was made before them, run setup's kit steps again\n`);
}

// Whether a stylesheet styles one class at least of the page's areas: a selector naming it, outside any
// comment. A kit that styles none of them, in none of its stylesheets, was made before them.
const stylesAnArea = css => {
  const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return AREA_CLASSES.some(name => new RegExp(`\\.${name}(?![\\w-])`).test(rules));
};

function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) process.stdout.write(USAGE);
    else draw(args);
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
