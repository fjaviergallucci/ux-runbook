#!/usr/bin/env node
// render: draws one Structure proposal, written in the walkthrough format (lib/walkthrough.mjs), as one
// HTML document in the shared kit, in exactly the markup kit/KIT-CONTRACT.md states. One script draws
// every proposal, so none looks better made than another: the page depends only on what the proposal
// says. Who made it (author, engine, track, model, source) and the maker's first idea are never drawn.
//
// As a module: renderProposal(proposal, { letter }) → the page, as a string. Pure; the same proposal and
// letter give the same bytes.
// As a command: see USAGE. Exit codes: 0 success · 1 an invalid proposal, an unreadable input or an
// unwritable output · 2 bad usage.
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './lib/walkthrough.mjs';

// ---- markup

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// The one escape. Every string of the proposal reaches the page through it, in text and in attributes
// alike, so it is shown as text and never read as markup; nothing else in it is changed.
const escape = value => String(value).replace(/[&<>"']/g, ch => ENTITIES[ch]);

// Markup this script wrote. html`…` keeps its own literal text, and the markup of an inner html`…`; every
// other value put into it is escaped. No string of the proposal reaches the page another way.
class Markup {
  constructor(text) {
    this.text = text;
  }
}
const put = value => {
  if (value instanceof Markup) return value.text;
  if (Array.isArray(value)) return value.map(put).join('');
  return escape(value);
};
function html(strings, ...values) {
  return new Markup(strings.reduce((out, string, i) => out + put(values[i - 1]) + string));
}

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

// ---- the drawing

// renderProposal(proposal, { letter }) → a whole HTML document that links kit.css from beside it.
// Throws a TypeError when the letter is not one capital letter or the proposal is not valid.
export function renderProposal(proposal, { letter } = {}) {
  if (typeof letter !== 'string' || !LETTER.test(letter)) {
    throw new TypeError(`the letter must be one capital letter, A to Z; it is ${JSON.stringify(letter)}`);
  }
  const errors = validate(proposal);
  if (errors.length) throw new TypeError(`not a valid proposal:\n${errors.join('\n')}`);
  return html`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Option ${letter}</title>
<link rel="stylesheet" href="kit.css">
</head>
<body>

${drawHeader(proposal, letter)}${proposal.screens.map(screen => drawFrame(screen))}
</body>
</html>
`.text;
}

// What the founder judges a structure by, before its frames: its letter and name, its bet, what it is
// deliberately bad at, what it leaves out and how it meets its hardest state.
function drawHeader(proposal, letter) {
  return html`<header>
  <h1>Option ${letter}: ${proposal.name}</h1>
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
</header>
`;
}

// One frame per screen: its caption (the title, then the screen's note), then the screen or the dialog.
// The kit paints a dialog's frame as the backdrop that stands for the screen it opens over, which has a
// frame of its own and is not drawn again here.
function drawFrame(screen) {
  return html`
<section class="ux-frame" data-screen="${screen.id}">
  <header>
    <h2>${screen.title}</h2>
${drawNote(screen, INDENT + INDENT)}  </header>
  <div class="ux-${screen.container}">
${drawItems(screen.items, INDENT + INDENT)}  </div>
</section>
`;
}

const drawItems = (items, pad) => items.map(item => (Object.hasOwn(item, 'role') ? drawRole(item, pad) : drawContainer(item, pad)));

// A role is one part that holds the item's text; a choice, a list and a nav end with their options. An
// item's id goes on its part as data-ux, as written. A note on the item is the part's next sibling.
function drawRole(item, pad) {
  const [tag, attribute = ''] = ROLE_ELEMENTS[item.role];
  const classes = item.primary === true ? 'ux-action is-primary' : `ux-${item.role}`;
  const id = Object.hasOwn(item, 'id') ? html` data-ux="${item.id}"` : '';
  const options = Object.hasOwn(item, 'options')
    ? html`\n${pad}${INDENT}<ul>\n${item.options.map(option => html`${pad}${INDENT}${INDENT}<li>${option}</li>\n`)}${pad}${INDENT}</ul>\n${pad}`
    : '';
  return html`${pad}<${tag} class="${classes}"${attribute}${id}>${item.text}${options}</${tag}>\n${drawNote(item, pad)}`;
}

// A container is one element holding its own items. A region or a group shows its label, when it has one,
// as a header; an expansion always shows its label, as a summary, and is open only when written open.
function drawContainer(item, pad) {
  const tag = CONTAINER_ELEMENTS[item.container];
  const inner = pad + INDENT;
  const open = item.open === true ? html` open` : '';
  let label = '';
  if (item.container === 'expansion') label = html`${inner}<summary>${item.label}</summary>\n`;
  else if (Object.hasOwn(item, 'label')) label = html`${inner}<header>${item.label}</header>\n`;
  return html`${pad}<${tag} class="ux-${item.container}"${open}>\n${label}${drawItems(item.items, inner)}${pad}</${tag}>\n`;
}

const drawNote = (holder, pad) => (Object.hasOwn(holder, 'note') ? html`${pad}<p class="ux-note">${holder.note}</p>\n` : '');

// ---- the command line

const USAGE = `Usage: node scripts/render.mjs <proposal.json> --kit <kit dir> --out <file.html> [--letter A]

Draws one Structure proposal, written in the walkthrough format, as one HTML document in the shared kit,
and copies <kit dir>/kit.css beside it. The page shows the option's letter, never who made the proposal.

  --kit <kit dir>     the kit to draw in: a folder holding kit.css (the grey kit is kit/grey)
  --out <file.html>   the page to write; its folder is made when it does not exist
  --letter <A to Z>   the option's letter on the board; A when not given

A flag may also be written --flag=value.

Exit codes: 0 success · 1 an invalid proposal, an unreadable input or an unwritable output · 2 bad usage.
`;
const FLAGS = ['kit', 'out', 'letter'];
const HELP = ['--help', '-h'];

class UsageError extends Error {}
// A failure the command expects and explains in one message: exit 1, without a stack.
class Failure extends Error {}

function readArgs(argv) {
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
    if (!FLAGS.includes(name)) throw new UsageError(`unknown flag --${name}`);
    if (Object.hasOwn(flags, name)) throw new UsageError(`--${name} is given twice`);
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined || value === '') throw new UsageError(`--${name} needs a value`);
    flags[name] = value;
  }
  if (positional.length !== 1) throw new UsageError(`render takes one <proposal.json>, got ${positional.length}`);
  for (const name of ['kit', 'out']) {
    if (!Object.hasOwn(flags, name)) throw new UsageError(`--${name} is missing`);
  }
  const letter = flags.letter ?? 'A';
  if (!LETTER.test(letter)) throw new UsageError(`--letter must be one capital letter, A to Z; it is "${letter}"`);
  return { path: positional[0], kit: flags.kit, out: flags.out, letter };
}

function readInput(file) {
  try {
    return readFileSync(file);
  } catch (e) {
    throw new Failure(`cannot read ${file}: ${e.code ?? e.message}`);
  }
}

function writeOutput(file, data) {
  try {
    writeFileSync(file, data);
  } catch (e) {
    throw new Failure(`cannot write ${file}: ${e.code ?? e.message}`);
  }
}

// Everything is read and checked before anything is written.
function draw({ path, kit, out, letter }) {
  let proposal;
  try {
    proposal = JSON.parse(readInput(path).toString('utf8'));
  } catch (e) {
    throw e instanceof SyntaxError ? new Failure(`cannot read ${path}: it is not JSON (${e.message})`) : e;
  }
  const errors = validate(proposal);
  if (errors.length) throw new Failure(`cannot draw ${path}: it is not a valid proposal\n${errors.join('\n')}`);
  const css = readInput(join(kit, 'kit.css'));
  const page = renderProposal(proposal, { letter });
  const folder = dirname(out);
  try {
    mkdirSync(folder, { recursive: true });
  } catch (e) {
    throw new Failure(`cannot write ${folder}: ${e.code ?? e.message}`);
  }
  writeOutput(out, page);
  writeOutput(join(folder, 'kit.css'), css);
  process.stdout.write(`drew option ${letter} to ${out}, with kit.css beside it\n`);
}

function main(argv) {
  try {
    const args = readArgs(argv);
    if (args.help) process.stdout.write(USAGE);
    else draw(args);
  } catch (e) {
    if (e instanceof UsageError) {
      process.stderr.write(`${e.message}\n\n${USAGE}`);
      process.exitCode = 2;
    } else if (e instanceof Failure) {
      process.stderr.write(`${e.message}\n`);
      process.exitCode = 1;
    } else {
      throw e;
    }
  }
}

// The command runs only when this file is the one node was given, never when it is imported.
const realpath = file => {
  try {
    return realpathSync(file);
  } catch {
    return null;
  }
};
if (process.argv[1] && realpath(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
