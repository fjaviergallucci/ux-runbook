import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { deflateSync } from 'node:zlib';
import { chromium } from 'playwright-core';
import { findChrome } from '../scripts/lib/chrome.mjs';
import { JsonFileError, ProposalFileError, readJsonFile, readProposalFile } from '../scripts/lib/json-file.mjs';
import { renderDecision, validateDecision } from '../scripts/page.mjs';
import { STAGES } from '../scripts/lib/state.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'page.mjs');
const samplePath = join(here, '..', 'templates', 'outputs', 'decision.json');
const approvePath = join(here, '..', 'templates', 'outputs', 'decision-approve.json');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'page-'));
after(() => rmSync(root, { recursive: true, force: true }));

// A fresh copy of the sample each time, to change at will.
const sample = () => JSON.parse(readFileSync(samplePath, 'utf8'));
const approveSample = () => JSON.parse(readFileSync(approvePath, 'utf8'));
// The sample with two open findings, as an approve-stage page carries them.
const withFindings = () => changed(d => {
  d.findings = [
    { seat: 'judge.accessibility', line: 'Partly fixed: focus in the booking dialog starts on Cancel.' },
    { seat: 'judge.truth', line: 'Still present: the empty state promises a waiting list the product does not have.' },
  ];
});
const count = (text, part) => text.split(part).length - 1;
const bodyOf = page => page.match(/<body>\n([\s\S]*)<\/body>/)[1];
const sectionOf = (page, name) => page.match(new RegExp(`<section class="${name}">\\n[\\s\\S]*?\\n</section>\\n`))?.[0];
// The data with one change made to it.
const changed = change => {
  const data = sample();
  change(data);
  return data;
};
// Exactly one error, and it says what the rule is.
const refuses = (data, pattern, what) => {
  const errors = validateDecision(data);
  assert.equal(errors.length, 1, `${what ?? pattern}: ${JSON.stringify(errors)}`);
  assert.match(errors[0], pattern, what);
};
const valid = (data, what) => assert.deepEqual(validateDecision(data), [], what);

// ---- the data

test('the sample decision.json is valid: the room-booking surface "today", three options and a gallery of one', () => {
  const data = sample();
  valid(data);
  assert.equal(data.identity.design, 'today');
  assert.deepEqual(data.options.map(o => o.letter), ['A', 'B', 'C']);
  assert.equal(data.gallery.items.length, 1);
  assert.equal(count(data.question, '?'), 1);
  // By convention an option's first picture is its phone-width one: it is the one drawn.
  for (const option of data.options) assert.match(option.images[0], /-390-light\.png$/, option.letter);
  const text = readFileSync(samplePath, 'utf8');
  assert.ok(!text.includes('\r'), 'LF line endings');
  assert.doesNotMatch(text, /\bVerbato\b/i);
  assert.doesNotMatch(text, /\bVersa\b/);
});

test('the approve sample is valid: one option, two seat lines, two open findings and a deviation accepted at Detail, a recommendation to approve', () => {
  const data = approveSample();
  valid(data);
  assert.deepEqual([data.options.length, data.seats.length, data.findings.length], [1, 2, 3]);
  // R186: the last finding shows the field, and the stage it names is the sample's own or an earlier one.
  assert.deepEqual(data.findings.map(finding => finding.accepted), [undefined, undefined, 'detail']);
  assert.ok(STAGES.indexOf('detail') + 1 <= data.identity.stage);
  assert.equal(data.recommendation.option, 'A');
  assert.match(data.recommendation.reason, /^Approve/);
  assert.match(data.options[0].images[0], /-390-light\.png$/, 'the phone picture first');
  assert.equal(data.identity.design, 'today');
  const text = readFileSync(approvePath, 'utf8');
  assert.ok(!text.includes('\r'), 'LF line endings');
  assert.doesNotMatch(text, /\bVerbato\b/i);
  assert.doesNotMatch(text, /\bVersa\b/);
});

test('open findings are a list of a seat and a line each, both text; an empty list or none is allowed', () => {
  valid(withFindings(), 'two findings');
  valid(changed(d => (d.findings = [])), 'an empty list');
  valid(sample(), 'none');
  const bad = d => d.findings[1];
  const cases = [
    [d => (d.findings = { seat: 'judge.truth' }), /^decision: "findings" must be a list of findings, each a seat and a line/],
    [d => (d.findings[1] = 'Still present'), /^findings\[1\]: must be an object$/],
    [d => delete bad(d).seat, /^findings\[1\]: "seat" is missing$/],
    [d => (bad(d).seat = ' '), /^findings\[1\]: "seat" must be a line of text/],
    [d => delete bad(d).line, /^findings\[1\]: "line" is missing$/],
    [d => (bad(d).line = ''), /^findings\[1\]: "line" must be a line of text/],
    [d => (bad(d).option = 'A'), /^findings\[1\]: unknown key "option"$/],
  ];
  for (const [change, pattern] of cases) {
    const data = withFindings();
    change(data);
    refuses(data, pattern, String(pattern));
  }
});

test('a seat says at most one line on each option, and at most one line on no option; a second is refused naming both', () => {
  refuses(changed(d => d.seats.push({ seat: 'judge.profile', line: 'B again.', option: 'B' })), /^seats\[4\]: a second line for "judge\.profile" on option B; the first is seats\[0\]$/);
  refuses(changed(d => d.seats.push({ seat: 'judge.truth', line: 'Again.' })), /^seats\[4\]: a second line for "judge\.truth" with no option; the first is seats\[1\]$/);
  // The same seat on another option, or on none beside one on an option, is another line.
  valid(changed(d => d.seats.push({ seat: 'judge.profile', line: 'A is slower.', option: 'A' })), 'another option');
  valid(changed(d => d.seats.push({ seat: 'judge.profile', line: 'On the whole, B.' })), 'no option beside an option');
  valid(changed(d => d.seats.push({ seat: 'judge.truth', line: 'C holds a fact the product lacks.', option: 'C' })), 'an option beside none');
  // A line whose option is not a letter on the page is its own fault, not a second line of its seat.
  const nulls = changed(d => d.seats.push({ seat: 'judge.truth', line: 'Again.', option: null }, { seat: 'judge.truth', line: 'Once more.', option: null }));
  assert.deepEqual(validateDecision(nulls), ['seats[4]: "option" names null, which is no option on this page', 'seats[5]: "option" names null, which is no option on this page']);
  // Two lines with no seat named are two faults of their own, not a second line of one seat.
  const nameless = changed(d => {
    delete d.seats[1].seat;
    delete d.seats[2].seat;
    delete d.seats[2].option;
  });
  assert.deepEqual(validateDecision(nameless), ['seats[1]: "seat" is missing', 'seats[2]: "seat" is missing']);
});

test('a question with more than one question mark is refused: a decision page asks one question', () => {
  refuses(changed(d => (d.question = 'Which structure goes on, A or B? And who reads it next?')), /^question: .*one question/);
  refuses(changed(d => (d.question = 'A? B? C?')), /one question/, 'three');
  refuses(changed(d => (d.question = 'Which one??')), /one question/, 'two together');
  // One question mark, or none, is one question; ¿ is not a question mark.
  valid(changed(d => (d.question = '¿Cuál sigue a Detail: A, B o C?')), 'Spanish');
  valid(changed(d => (d.question = 'Pick the structure that goes on to Detail.')), 'no mark');
});

test('every question mark counts, ? and the full-width \\uFF1F and the Arabic \\u061F alike; the opening \u00bf does not', () => {
  const FULL = '\uFF1F';
  const ARABIC = '\u061F';
  for (const mark of ['?', FULL, ARABIC]) valid(changed(d => (d.question = `Which structure goes on to Detail${mark}`)), `alone: ${JSON.stringify(mark)}`);
  const pairs = [['?', FULL], [FULL, '?'], ['?', ARABIC], [ARABIC, '?'], [FULL, ARABIC], [FULL, FULL], [ARABIC, ARABIC]];
  for (const [first, second] of pairs) {
    refuses(
      changed(d => (d.question = `Which structure goes on${first} And who reads it${second}`)),
      /^question: asks more than one question \(2 question marks\): a decision page asks one question$/,
      `together: ${JSON.stringify(first + second)}`,
    );
  }
  refuses(changed(d => (d.question = `A? B${FULL} C${ARABIC}`)), /^question: asks more than one question \(3 question marks\)/, 'one of each');
  valid(changed(d => (d.question = '\u00bfCu\u00e1l sigue a Detail: A, B o C?')), 'a Spanish question');
});

// R173: the page asks one question, and its marks are counted where the page speaks to him: in the question and
// in the reason of the recommendation. What a seat said, a finding, a title or a line may quote a question.
test('question marks are counted in the question and in the reason only: a seat, a finding, an option and the gallery may quote a question', () => {
  const quoting = 'She asks "is Room 3 free?" and "until when?", and the page does not say.';
  valid(changed(d => (d.seats[0].line = quoting)), 'a seat');
  valid(changed(d => (d.findings = [{ seat: 'audience.task-reader', line: quoting }])), 'a finding');
  valid(changed(d => (d.findings = [{ seat: 'audience.task-reader', line: quoting, accepted: 'detail' }])), 'an accepted finding');
  valid(changed(d => (d.options[0].line = quoting)), 'an option');
  valid(changed(d => (d.options[0].title = 'Is anything free?')), 'a title');
  valid(changed(d => (d.gallery.title = 'What else could it be?')), 'the gallery');
  valid(changed(d => (d.gallery.items[0].line = quoting)), 'an item');
  valid(changed(d => (d.identity.design = 'free now?')), 'the identity');
  valid(changed(d => {
    d.seats.forEach(seat => (seat.line = quoting));
    d.options.forEach(option => (option.line = quoting));
  }), 'all of them at once');
  // The reason is the page speaking to him: a mark there is a second question beside the page's own.
  const asking = 'Take B, since "what is free now?" is what she asks first';
  refuses(changed(d => (d.recommendation.reason = asking)), /^recommendation: "reason" and the question hold 2 question marks between them: a decision page asks one question$/);
  refuses(changed(d => (d.recommendation.reason = asking.replace('?', '\uFF1F'))), /^recommendation: "reason" and the question hold 2 question marks between them/, 'the full-width mark');
  refuses(changed(d => {
    d.question = 'Pick the structure that goes on to Detail.';
    d.recommendation.reason = 'Take B, since "what is free?" and "until when?" are what she asks';
  }), /^recommendation: "reason" and the question hold 2 question marks between them/, 'both in the reason');
  // One mark between the two is one question, wherever it stands.
  valid(changed(d => {
    d.question = 'Pick the structure that goes on to Detail.';
    d.recommendation.reason = asking;
  }), 'the one mark is in the reason');
  // A question that asks two is said once, as the question's fault, whatever the reason holds.
  refuses(changed(d => {
    d.question = 'A or B? And who reads it next?';
    d.recommendation.reason = asking;
  }), /^question: asks more than one question \(2 question marks\): a decision page asks one question$/);
  // A reason of two sentences is said as that, and not as a second question too.
  refuses(changed(d => (d.recommendation.reason = 'Is B the one she reaches for? Take B.')), /^recommendation: "reason" must be one sentence/);
  // In the order of the page: the recommendation's fault comes before the question's.
  const two = validateDecision(changed(d => {
    d.recommendation.reason = 'Take B, since "what is free?" and "until when?" are what she asks';
    delete d.question;
  }));
  assert.deepEqual(two, ['recommendation: "reason" and the question hold 2 question marks between them: a decision page asks one question', 'decision: "question" is missing']);
});

// R186: a finding the founder already accepted at a stage carries that stage, and is not an open finding.
test('a finding may carry "accepted", the stage it was accepted at; anything but a stage is refused', () => {
  for (const stage of STAGES) valid(changed(d => (d.findings = [{ seat: 'judge.accessibility', line: 'The booking action is 40 by 40.', accepted: stage }])), stage);
  for (const [value, shown] of [['', '""'], ['Detail', '"Detail"'], ['accepted at detail', '"accepted at detail"'], ['fix', '"fix"'], [true, 'true'], [6, '6'], [null, 'null'], [['detail'], '\\["detail"\\]']]) {
    refuses(
      changed(d => (d.findings = [{ seat: 'judge.truth', line: 'Open.' }, { seat: 'judge.accessibility', line: 'The booking action is 40 by 40.', accepted: value }])),
      new RegExp(`^findings\\[1\\]: "accepted" must be the stage the deviation was accepted at, one of ${STAGES.join(', ')}; it is ${shown}$`),
      JSON.stringify(value),
    );
  }
  refuses(changed(d => (d.findings = [{ seat: 'judge.truth', line: 'Open.', acepted: 'detail' }])), /^findings\[0\]: unknown key "acepted"$/);
  refuses(changed(d => (d.seats[0].accepted = 'detail')), /^seats\[0\]: unknown key "accepted"$/, 'a seat line is not a finding');
});

test('a missing, empty or blank question is refused', () => {
  refuses(changed(d => delete d.question), /^decision: "question" is missing$/);
  for (const question of ['', '   ', 42, null, ['Which?']]) {
    refuses(changed(d => (d.question = question)), /^decision: "question" must be a line of text/, JSON.stringify(question));
  }
});

test('identity: missing, not an object, or missing any of its five fields is refused', () => {
  refuses(changed(d => delete d.identity), /^decision: "identity" is missing$/);
  refuses(changed(d => (d.identity = 'today')), /^decision: "identity" must be an object/);
  for (const field of ['design', 'kind', 'size', 'stage', 'of']) {
    refuses(changed(d => delete d.identity[field]), new RegExp(`^identity: "${field}" is missing$`), field);
  }
  for (const field of ['design', 'kind', 'size']) {
    refuses(changed(d => (d.identity[field] = ' ')), new RegExp(`^identity: "${field}" must be a line of text`), field);
  }
});

test('identity: the stage and the count of stages are whole numbers from 1, and the stage is not beyond the last', () => {
  for (const field of ['stage', 'of']) {
    for (const value of [0, -1, 1.5, 10.5, '5', null]) {
      refuses(changed(d => (d.identity[field] = value)), new RegExp(`^identity: "${field}" must be a whole number from 1`), `${field} ${value}`);
    }
  }
  refuses(changed(d => (d.identity.stage = 10)), /^identity: stage 10 is beyond the last stage, 9$/);
  valid(changed(d => (d.identity.stage = 9)), 'the last stage');
  valid(changed(d => Object.assign(d.identity, { stage: 1, of: 1 })), 'stage 1 of 1');
});

test('a recommendation.reason of more than one sentence is refused: one sentence', () => {
  const second = [
    'It answers her question first. It costs a scroll for the busy rooms.',
    'It answers her question first! 2 clicks book a walk-in.',
    'Is it fastest? Yes, on every read.',
    'It answers first.  Él no lo dice.',
    'It answers first.\nIt costs a scroll.',
  ];
  for (const reason of second) refuses(changed(d => (d.recommendation.reason = reason)), /^recommendation: "reason" must be one sentence/, reason);
  // Only a mark, then space, then a capital letter or a digit, begins a second sentence.
  const one = ['It frees Room 2 at 10.30, before the others.', 'It is quick, i.e. two clicks.', 'It answers first.', 'It answers first.  ', 'It answers first... and books fast.'];
  for (const reason of one) valid(changed(d => (d.recommendation.reason = reason)), reason);
});

test('a recommendation that is missing, has no reason, or names an option that is not on the page is refused', () => {
  refuses(changed(d => delete d.recommendation), /^decision: "recommendation" is missing$/);
  refuses(changed(d => (d.recommendation = 'B')), /^decision: "recommendation" must be an object/);
  refuses(changed(d => delete d.recommendation.reason), /^recommendation: "reason" is missing$/);
  refuses(changed(d => (d.recommendation.reason = '')), /^recommendation: "reason" must be a line of text/);
  refuses(changed(d => delete d.recommendation.option), /^recommendation: "option" is missing$/);
  refuses(changed(d => (d.recommendation.option = 'D')), /^recommendation: "option" names "D", which is no option on this page$/);
  refuses(changed(d => (d.recommendation.option = 'b')), /^recommendation: "option" names "b", which is no option on this page$/);
});

test('options: missing, not a list, or empty is refused', () => {
  refuses(changed(d => delete d.options), /^decision: "options" is missing$/);
  // With no options, the recommendation names none: the one fault is reported once.
  refuses(changed(d => (d.options = [])), /^decision: "options" must be a list of at least one option/);
  refuses(changed(d => (d.options = { A: {} })), /^decision: "options" must be a list of at least one option/);
  refuses(changed(d => (d.options[1] = 'B')), /^options\[1\]: must be an object$/);
});

test('an option without a letter, or whose letter is not one capital letter, is refused', () => {
  refuses(changed(d => delete d.options[2].letter), /^options\[2\]: "letter" is missing$/);
  for (const letter of ['c', 'CC', 'Ç', '3', '', 3, ['C']]) {
    // A seat names C; with a letter at fault, what names an option is not checked against it again.
    refuses(changed(d => (d.options[2].letter = letter)), /^options\[2\]: "letter" must be one capital letter, A to Z/, JSON.stringify(letter));
  }
});

test('two options with the same letter are refused', () => {
  // Nothing names A, so the repeated letter is the one fault.
  refuses(changed(d => (d.options[0].letter = 'B')), /^options\[1\]: letter "B" is already options\[0\]$/);
});

test('an option with neither an image nor a line is refused; either alone is enough', () => {
  refuses(changed(d => { delete d.options[0].line; d.options[0].images = []; }), /^options\[0\]: has neither an image nor a line/);
  refuses(changed(d => { delete d.options[0].line; delete d.options[0].images; }), /^options\[0\]: has neither an image nor a line/);
  valid(changed(d => delete d.options[0].line), 'images alone');
  valid(changed(d => delete d.options[0].images), 'a line alone');
  valid(changed(d => (d.options[0].images = [])), 'a line and no image');
  refuses(changed(d => (d.options[0].line = ' ')), /^options\[0\]: "line" must be a line of text/);
  refuses(changed(d => (d.options[0].images = 'shots/A.png')), /^options\[0\]: "images" must be a list of paths/);
  // A line or a list at fault is said as itself, not again as nothing shown.
  refuses(changed(d => { delete d.options[0].line; d.options[0].images = ''; }), /^options\[0\]: "images" must be a list of paths/);
  refuses(changed(d => { delete d.options[0].images; d.options[0].line = ''; }), /^options\[0\]: "line" must be a line of text/);
  refuses(changed(d => delete d.options[0].title), /^options\[0\]: "title" is missing$/);
});

test('an image is a relative path, as written: an absolute path, a URL, a scheme or a hidden scheme is refused', () => {
  const refused = [
    '/shots/A.png', '\\shots\\A.png', '//host/A.png', 'C:/shots/A.png', 'C:\\shots\\A.png', 'C:A.png',
    'https://example.com/A.png', 'file:///shots/A.png', 'data:image/png;base64,AAAA', 'javascript:alert(1)',
    ' javascript:alert(1)', 'java\tscript:alert(1)', 'shots/A.png\n', 'shots/A\u007f.png', '', '   ', 7,
  ];
  for (const path of refused) {
    refuses(changed(d => (d.options[1].images[0] = path)), /^options\[1\]\.images\[0\]: must be a relative path to a picture/, JSON.stringify(path));
    refuses(changed(d => (d.gallery.items[0].images[0] = path)), /^gallery\.items\[0\]\.images\[0\]: must be a relative path to a picture/, `gallery ${JSON.stringify(path)}`);
  }
  for (const path of ['A.png', 'shots/A 1280 light.png', '../fresh/today-1.png', 'shots/Reunión 🙂.png', 'shots/./A.png']) {
    valid(changed(d => (d.options[1].images[0] = path)), path);
  }
});

test('a picture path holding #, ?, % or a backslash is refused: a browser reads them as part of an address, the disk does not', () => {
  for (const path of ['shots/A#1.png', 'shots/A?.png', 'shots/A%201280.png', '#', '?', '%', 'shots\\A.png', 'fresh\\today-2.png']) {
    refuses(changed(d => (d.options[0].images[1] = path)), /^options\[0\]\.images\[1\]: a picture path cannot hold "#", "\?", "%" or "\\": a browser reads them as part of an address, a backslash as "\/", so it would not find the file the disk holds; it is /, path);
    refuses(changed(d => (d.gallery.items[0].images[0] = path)), /^gallery\.items\[0\]\.images\[0\]: a picture path cannot hold/, `gallery ${path}`);
  }
});

test('a seat line that names an option not among the options is refused; a seat names none if it likes', () => {
  refuses(changed(d => (d.seats[0].option = 'Z')), /^seats\[0\]: "option" names "Z", which is no option on this page$/);
  valid(changed(d => delete d.seats[0].option), 'no option');
  refuses(changed(d => delete d.seats[1].seat), /^seats\[1\]: "seat" is missing$/);
  refuses(changed(d => delete d.seats[1].line), /^seats\[1\]: "line" is missing$/);
  refuses(changed(d => (d.seats[1] = 'judge.truth')), /^seats\[1\]: must be an object$/);
  refuses(changed(d => delete d.seats), /^decision: "seats" is missing$/);
  refuses(changed(d => (d.seats = {})), /^decision: "seats" must be a list of seats/);
  valid(changed(d => (d.seats = [])), 'no seat sat');
});

test('a gallery needs a title and at least one item; each item a title and an image or a line', () => {
  valid(changed(d => delete d.gallery), 'no gallery');
  refuses(changed(d => (d.gallery = [])), /^decision: "gallery" must be an object/);
  refuses(changed(d => delete d.gallery.title), /^gallery: "title" is missing$/);
  refuses(changed(d => (d.gallery.items = [])), /^gallery: "items" must be a list of at least one item/);
  refuses(changed(d => delete d.gallery.items[0].title), /^gallery\.items\[0\]: "title" is missing$/);
  refuses(changed(d => (d.gallery.items[0] = 'A plan of the floor')), /^gallery\.items\[0\]: must be an object$/);
  refuses(changed(d => { delete d.gallery.items[0].line; d.gallery.items[0].images = []; }), /^gallery\.items\[0\]: has neither an image nor a line/);
  valid(changed(d => delete d.gallery.items[0].line), 'an image alone');
  // A gallery item is not an option: it has no letter, and the recommendation cannot name it.
  refuses(changed(d => (d.gallery.items[0].letter = 'D')), /^gallery\.items\[0\]: unknown key "letter"$/);
});

test('an unknown key is refused at every level, so a misspelt part never silently vanishes from the page', () => {
  const levels = [
    ['decision', d => d],
    ['identity', d => d.identity],
    ['recommendation', d => d.recommendation],
    ['options\\[0\\]', d => d.options[0]],
    ['seats\\[0\\]', d => d.seats[0]],
    ['gallery', d => d.gallery],
    ['gallery\\.items\\[0\\]', d => d.gallery.items[0]],
    ['findings\\[0\\]', d => d.findings[0]],
  ];
  for (const [path, at] of levels) {
    const data = withFindings();
    at(data).galery = 'x';
    refuses(data, new RegExp(`^${path}: unknown key "galery"$`), path);
  }
});

test('validateDecision reports something that is not an object as one error, and every fault in the order of the page', () => {
  for (const data of [null, undefined, [], 'decision', 5]) assert.deepEqual(validateDecision(data), ['decision: must be an object'], String(data));
  const data = changed(d => {
    d.identity.stage = 0;
    d.options[0].letter = 'B';
    d.question = 'A? B?';
  });
  const errors = validateDecision(data);
  assert.equal(errors.length, 3, errors.join('\n'));
  assert.match(errors[0], /^identity: "stage"/);
  assert.match(errors[1], /^options\[1\]: letter "B"/);
  assert.match(errors[2], /^question: .*one question/);
});

// ---- the page

test('the page is one self-contained file: inline styles with a light and a dark set, no script, no external resource', () => {
  const data = sample();
  const page = renderDecision(data);
  assert.ok(page.startsWith('<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'), page.slice(0, 120));
  assert.ok(page.endsWith('</body>\n</html>\n'));
  assert.equal(count(page, '<style>'), 1);
  const style = page.match(/<style>\n([\s\S]*?)<\/style>/)[1];
  assert.match(style, /color-scheme: light dark/);
  assert.match(style, /@media \(prefers-color-scheme: dark\) \{/);
  assert.doesNotMatch(page, /<script|<link|<iframe|<object|<embed|@import|url\(|@font-face/i);
  assert.doesNotMatch(page, /\bon[a-z]+=/i, 'no event handler');
  // A picture is shown whole: nothing in the styles crops, clips, fixes a size or hides what overflows.
  assert.doesNotMatch(style, /max-height|object-fit|object-position|clip|aspect-ratio|overflow\s*:\s*(hidden|clip)/);
  const picture = style.match(/\.picture img \{\n([\s\S]*?)\n\}/)[1];
  assert.match(picture, /max-width: 100%;/);
  assert.match(picture, /height: auto;/);
  assert.doesNotMatch(picture, /(^|\s)(width|height|min-width|min-height)\s*:(?!\s*auto;)/m, 'no size of its own but the cap');
  // One picture drawn for each option and each gallery item, each inside a link to its own file.
  const pictures = [...page.matchAll(/<img src="([^"]*)"/g)].map(([, src]) => src);
  assert.deepEqual(pictures, [...data.options, ...data.gallery.items].map(shown => shown.images[0]));
  for (const src of pictures) assert.equal(count(page, `<a class="picture" href="${src}"><img src="${src}" `), 1, src);
  // Three columns, each holding a phone picture whole, fit side by side in a window 1440 wide.
  const rem = (rule, property) => Number(style.match(new RegExp(`${rule} \\{[^}]*?\\b${property}: (?:min\\()?([\\d.]+)rem`))[1]);
  const [page_, column, gap, cardPad] = [rem('body', 'max-width'), rem('\\.option, \\.item', 'width'), rem('\\.row', 'gap'), rem('\\.option, \\.item', 'padding')];
  const bodyPad = Number(style.match(/body \{[^}]*?padding: [\d.]+rem ([\d.]+)rem/)[1]);
  assert.ok(3 * column + 2 * gap <= page_ - 2 * bodyPad, `three columns of ${column}rem and two gaps fit in ${page_}rem less its padding`);
  assert.ok(page_ * 16 <= 1440, `the page is at most 1440 px wide: ${page_ * 16}`);
  assert.ok((column - 2 * cardPad) * 16 - 2 >= 390 + 2, 'a column holds a 390 px picture and its border');
  // The options' row scrolls sideways on its own; nothing else declares an overflow, so the page never does.
  assert.match(style.match(/\.row \{[^}]*\}/)[0], /overflow-x: auto;/);
  assert.equal(style.match(/\boverflow(-[xy])?\s*:/g).length, 1, 'one overflow declared: the row\'s');
  // The question is pinned to the bottom of the screen, on a solid background of the page's own colours.
  const question = style.match(/\.question \{[^}]*\}/)[0];
  assert.match(question, /position: sticky;/);
  assert.match(question, /bottom: 0;/);
  assert.match(question, /background: var\(--(page|surface)\);/);
  // Every reference the page makes is to a picture the data names, by the path as written.
  const named = new Set([...data.options, ...data.gallery.items].flatMap(o => o.images));
  const refs = [...page.matchAll(/\b(?:src|href)="([^"]*)"/g)].map(([, ref]) => ref);
  assert.ok(refs.length > 0);
  for (const ref of refs) assert.ok(named.has(ref), ref);
  assert.equal(renderDecision(data), page, 'the same data gives the same bytes');
});

test('the body starts with the identity line: design · kind · size · stage n of m', () => {
  const page = renderDecision(sample());
  assert.ok(bodyOf(page).startsWith('<h1 class="identity">today · working-surface · surface · stage 5 of 9</h1>\n'), bodyOf(page).slice(0, 100));
  assert.match(page, /<title>Decision: today, stage 5 of 9<\/title>/);
});

test('each option shows its letter, title and line, its first picture whole and a link to each other picture, in the order of the data', () => {
  const data = sample();
  const page = renderDecision(data);
  const options = sectionOf(page, 'options');
  assert.ok(options.startsWith('<section class="options">\n<h2>The options</h2>\n<div class="row">\n'), options.slice(0, 80));
  let last = -1;
  for (const option of data.options) {
    const [first, second] = option.images;
    const article = `<article class="option">
<h3><span class="letter">${option.letter}</span> ${option.title}</h3>
<p>${option.line}</p>
<a class="picture" href="${first}"><img src="${first}" alt="Option ${option.letter}, picture 1 of 2"></a>
<ul class="more">
<li><a href="${second}">${second.slice(6, -4)}</a></li>
</ul>
</article>
`;
    const at = options.indexOf(article);
    assert.ok(at > last, `${option.letter}: ${article}`);
    last = at;
  }
  // An option with no line, or no picture, draws only what it has; one with a single picture lists none.
  const bare = sectionOf(renderDecision(changed(d => {
    delete d.options[0].line;
    d.options[1].images = [];
    d.options[2].images = ['shots/C-390-light.png'];
  })), 'options');
  assert.ok(bare.includes('<h3><span class="letter">A</span> One list, every room</h3>\n<a class="picture" href="shots/A-390-light.png">'));
  assert.ok(bare.includes(`<p>${sample().options[1].line}</p>\n</article>`));
  assert.ok(bare.includes('<a class="picture" href="shots/C-390-light.png"><img src="shots/C-390-light.png" alt="Option C, picture 1 of 1"></a>\n</article>'));
});

test('an option or a gallery item with three pictures draws exactly one, and links to the other two by their file names', () => {
  const three = ['shots/A-390-light.png', 'shots/A-1280-light.png', 'shots/more/A-1280-dark.final.webp'];
  const data = changed(d => {
    d.options[0].images = three;
    d.gallery.items[0].images = ['fresh/today-1.png', 'fresh/more/today-2.png', '../fresh/.plain'];
  });
  const page = renderDecision(data);
  const article = page.match(/<article class="option">\n<h3><span class="letter">A<\/span>[\s\S]*?<\/article>\n/)[0];
  assert.equal(count(article, '<img '), 1);
  assert.ok(article.includes('<a class="picture" href="shots/A-390-light.png"><img src="shots/A-390-light.png" alt="Option A, picture 1 of 3"></a>'));
  assert.ok(article.includes('<ul class="more">\n<li><a href="shots/A-1280-light.png">A-1280-light</a></li>\n<li><a href="shots/more/A-1280-dark.final.webp">A-1280-dark.final</a></li>\n</ul>\n'));
  assert.equal(count(article, '<a '), 3);
  const item = sectionOf(page, 'gallery');
  assert.equal(count(item, '<img '), 1);
  assert.ok(item.includes('<a class="picture" href="fresh/today-1.png"><img src="fresh/today-1.png" alt="Gallery item 1, picture 1 of 3"></a>'));
  assert.ok(item.includes('<li><a href="fresh/more/today-2.png">today-2</a></li>\n<li><a href="../fresh/.plain">.plain</a></li>'));
  // Every picture the data names is still on the page, once as an address of its own.
  for (const image of [...three, ...data.gallery.items[0].images]) assert.equal(count(page, `href="${image}"`), 1, image);
});
test('the order: the options, the gallery under its own title, the seats, the recommendation, and the question last', () => {
  const data = sample();
  const page = renderDecision(data);
  const body = bodyOf(page);
  const at = ['identity', 'options', 'gallery', 'seats', 'recommendation', 'question'].map(name => body.indexOf(`class="${name}"`));
  assert.deepEqual([...at].sort((a, b) => a - b), at, `in order: ${at}`);
  assert.ok(at.every(i => i >= 0));
  // The gallery is a second row of its own, under its own title.
  assert.ok(sectionOf(page, 'gallery').startsWith(`<section class="gallery">\n<h2>${data.gallery.title}</h2>\n<div class="row">\n<article class="item">`));
  assert.ok(sectionOf(page, 'gallery').includes(`<img src="fresh/today-1.png" alt="Gallery item 1, picture 1 of 1">`));
  // The question is the last thing on the page.
  assert.ok(body.endsWith(`<section class="question">\n<h2>The question</h2>\n<p>${data.question}</p>\n</section>\n`), body.slice(-200));
  assert.equal(count(page, '?'), 1, 'the only question mark on the page is the question');
});

test('open findings are drawn after the seats\' lines, under "Open findings", each with its seat; none, no section', () => {
  const data = withFindings();
  const page = renderDecision(data);
  const body = bodyOf(page);
  assert.ok(body.indexOf('class="seats"') < body.indexOf('class="findings"'));
  assert.ok(body.indexOf('class="findings"') < body.indexOf('class="recommendation"'));
  assert.equal(sectionOf(page, 'findings'), `<section class="findings">
<h2>Open findings</h2>
<ul>
<li><strong>judge.accessibility</strong> ${data.findings[0].line}</li>
<li><strong>judge.truth</strong> ${data.findings[1].line}</li>
</ul>
</section>
`);
  for (const without of [sample(), changed(d => (d.findings = []))]) assert.doesNotMatch(renderDecision(without), /class="findings"|Open findings/);
  const marked = renderDecision(changed(d => (d.findings = [{ seat: 'judge.<i>truth</i>', line: 'Still <b>present</b> & "open"' }])));
  assert.ok(marked.includes('<li><strong>judge.&lt;i&gt;truth&lt;/i&gt;</strong> Still &lt;b&gt;present&lt;/b&gt; &amp; &quot;open&quot;</li>'));
});

test('accepted deviations are drawn under a heading of their own, after the open findings, each with its seat and its stage; none, no section', () => {
  const accepted = [
    { seat: 'judge.accessibility', line: 'The booking action is 40 by 40 on a phone.', accepted: 'detail' },
    { seat: 'judge.visual-craft', line: 'The list keeps twelve rooms to a page.', accepted: 'look' },
  ];
  // Mixed with open findings, in any order in the data: each kind under its own heading, in the data's order.
  const data = withFindings();
  const [first, second] = data.findings;
  data.findings = [accepted[0], first, accepted[1], second];
  const page = renderDecision(data);
  const body = bodyOf(page);
  const at = ['seats', 'findings', 'accepted', 'recommendation'].map(name => body.indexOf(`<section class="${name}">`));
  assert.deepEqual([...at].sort((a, b) => a - b), at, `in order: ${at}`);
  assert.ok(at.every(i => i >= 0));
  assert.equal(sectionOf(page, 'findings'), `<section class="findings">
<h2>Open findings</h2>
<ul>
<li><strong>judge.accessibility</strong> ${first.line}</li>
<li><strong>judge.truth</strong> ${second.line}</li>
</ul>
</section>
`);
  assert.equal(sectionOf(page, 'accepted'), `<section class="accepted">
<h2>Accepted deviations</h2>
<ul>
<li><strong>judge.accessibility</strong> <span class="on">accepted at detail</span> The booking action is 40 by 40 on a phone.</li>
<li><strong>judge.visual-craft</strong> <span class="on">accepted at look</span> The list keeps twelve rooms to a page.</li>
</ul>
</section>
`);
  // Accepted deviations alone: no open findings are claimed; open findings alone: no second heading.
  const alone = renderDecision(changed(d => (d.findings = accepted)));
  assert.doesNotMatch(alone, /class="findings"|Open findings/);
  assert.equal(count(alone, '<h2>Accepted deviations</h2>'), 1);
  assert.ok(bodyOf(alone).includes('</section>\n<section class="accepted">'));
  for (const without of [sample(), withFindings(), changed(d => (d.findings = []))]) assert.doesNotMatch(renderDecision(without), /class="accepted"|Accepted deviations|accepted at/);
  // It is styled as the open findings are: one list, a line between its entries.
  const style = page.match(/<style>\n([\s\S]*?)<\/style>/)[1];
  for (const selector of ['.seats ul, .findings ul, .accepted ul', '.seats li, .findings li, .accepted li', '.seats li:last-child, .findings li:last-child, .accepted li:last-child']) assert.ok(style.includes(`${selector} {`), selector);
  const marked = renderDecision(changed(d => (d.findings = [{ seat: 'judge.<i>truth</i>', line: 'Kept <b>as is</b> & "accepted"', accepted: 'look' }])));
  assert.ok(marked.includes('<li><strong>judge.&lt;i&gt;truth&lt;/i&gt;</strong> <span class="on">accepted at look</span> Kept &lt;b&gt;as is&lt;/b&gt; &amp; &quot;accepted&quot;</li>'));
});

test('without a gallery, nothing of one is drawn; without a seat, no seats section', () => {
  const page = renderDecision(changed(d => { delete d.gallery; d.seats = []; }));
  assert.doesNotMatch(page, /class="gallery"|class="seats"|fresh\//);
  assert.ok(bodyOf(page).includes('</section>\n<section class="recommendation">'));
});

test('a seat shows its seat, the option it names when it names one, and its line', () => {
  const data = sample();
  const seats = sectionOf(renderDecision(data), 'seats');
  assert.equal(count(seats, '<li>'), data.seats.length);
  assert.ok(seats.includes(`<li><strong>judge.profile</strong> <span class="on">Option B</span> ${data.seats[0].line}</li>`));
  assert.ok(seats.includes(`<li><strong>judge.truth</strong> ${data.seats[1].line}</li>`));
});

test('the recommendation names its option and the option\'s title, then its one-sentence reason', () => {
  const data = sample();
  assert.equal(sectionOf(renderDecision(data), 'recommendation'), `<section class="recommendation">
<h2>The recommendation</h2>
<p class="pick">Option B: Free rooms first</p>
<p>${data.recommendation.reason}</p>
</section>
`);
});

test('a line containing <b> is shown escaped', () => {
  const page = renderDecision(changed(d => (d.options[0].line = 'Rooms in <b>bold</b> & "quoted"')));
  assert.ok(page.includes('<p>Rooms in &lt;b&gt;bold&lt;/b&gt; &amp; &quot;quoted&quot;</p>'));
  assert.doesNotMatch(page, /<b>/);
});

test('every string of the data goes through the one escape: identity, options, gallery, seats, findings, recommendation, question', () => {
  // Letters and numbers stay; every other string becomes markup of its own, numbered.
  const keep = new Set(['letter', 'option', 'stage', 'of']);
  let made = 0;
  const hostile = (value, key) => {
    if (typeof value === 'string') return keep.has(key) ? value : `<b title="x">'Tom & Jerry' "${++made}"</b>`;
    if (Array.isArray(value)) return value.map(v => hostile(v, key));
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, hostile(v, k)]));
    return value;
  };
  const data = hostile(withFindings());
  assert.deepEqual(validateDecision(data), []);
  const page = renderDecision(data);
  const numberOf = text => Number(text.match(/"(\d+)"/)[1]);
  // The design is in the title too; the recommended option's title is in the recommendation too; a first
  // picture's path is in its link and its image; any other path is in its link alone (its name, after the
  // last /, is a piece of it).
  const twice = new Set([data.identity.design, data.options.find(o => o.letter === data.recommendation.option).title].map(numberOf));
  const paths = new Set([...data.options, ...data.gallery.items].map(o => numberOf(o.images[0])));
  for (let n = 1; n <= made; n++) {
    const escaped = `&lt;b title=&quot;x&quot;&gt;&#39;Tom &amp; Jerry&#39; &quot;${n}&quot;&lt;/b&gt;`;
    assert.equal(count(page, escaped), twice.has(n) || paths.has(n) ? 2 : 1, `string ${n}`);
  }
  assert.ok(made > 30, `${made} strings`);
  assert.doesNotMatch(page, /<b[\s>]|Tom & Jerry|'Tom|"\d+"/);
});

test('text that is not plain ASCII, or is markup, is shown as text and kept intact', () => {
  const page = renderDecision(changed(d => {
    d.options[0].title = 'Reunión — sala 3 🙂';
    d.seats[1].line = '<script>alert(1)</script>';
    d.question = '¿Cuál sigue, la A o la B?';
  }));
  assert.ok(page.includes('<h3><span class="letter">A</span> Reunión — sala 3 🙂</h3>'));
  assert.ok(page.includes('<li><strong>judge.truth</strong> &lt;script&gt;alert(1)&lt;/script&gt;</li>'));
  assert.ok(page.includes('<p>¿Cuál sigue, la A o la B?</p>'));
  assert.doesNotMatch(page, /<script/i);
  assert.doesNotMatch(page, /&#x?[0-9a-f]+;(?<!&#39;)/i, 'no character is written as a numeric reference but the apostrophe');
});

test('a picture is referenced by its path as given: never copied, never rewritten', () => {
  const page = renderDecision(changed(d => (d.options[0].images = ['shots/A & B 390.png', '../fresh/Reunión <1>.png'])));
  assert.ok(page.includes('<a class="picture" href="shots/A &amp; B 390.png"><img src="shots/A &amp; B 390.png" alt="Option A, picture 1 of 2"></a>'));
  assert.ok(page.includes('<li><a href="../fresh/Reunión &lt;1&gt;.png">Reunión &lt;1&gt;</a></li>'));
});

test('renderDecision refuses invalid data with every error', () => {
  const data = changed(d => {
    d.question = 'A? B?';
    delete d.identity.kind;
  });
  const errors = validateDecision(data);
  assert.equal(errors.length, 2);
  assert.throws(() => renderDecision(data), e => e instanceof TypeError && e.message === `not a valid decision page:\n${errors.join('\n')}`);
});

test('render and the decision page escape through the one shared escape, lib/html.mjs', () => {
  const source = name => readFileSync(join(here, '..', 'scripts', name), 'utf8');
  for (const name of ['render.mjs', 'page.mjs']) {
    assert.match(source(name), /^import \{[^}]*\bhtml\b[^}]*\} from '\.\/lib\/html\.mjs';$/m, name);
    assert.ok(!source(name).includes('&amp;'), `${name} writes no escape of its own`);
  }
});

test('a JSON file is read one way, by lib/json-file.mjs, under its own name and under the name render and merge use', () => {
  assert.equal(readProposalFile, readJsonFile);
  assert.equal(ProposalFileError, JsonFileError);
  assert.ok(!existsSync(join(here, '..', 'scripts', 'lib', 'proposal-file.mjs')), 'the old module is gone');
  for (const name of ['page.mjs', 'shots.mjs', 'render.mjs', 'merge.mjs', join('lib', 'merge.mjs')]) {
    const source = readFileSync(join(here, '..', 'scripts', name), 'utf8');
    assert.match(source, /from '\.\.?\/(lib\/)?json-file\.mjs';/, name);
    assert.doesNotMatch(source, /proposal-file/, name);
  }
  const page = readFileSync(cli, 'utf8');
  assert.match(page, /import \{ JsonFileError, readJsonFile, reason \} from '\.\/lib\/json-file\.mjs';/);
});

test('no product name appears in the decision page script', () => {
  const text = readFileSync(cli, 'utf8');
  assert.doesNotMatch(text, /\bVerbato\b/i);
  assert.doesNotMatch(text, /\bVersa\b/);
});

// ---- the command line

const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', cwd: root });
let made = 0;
const fresh = () => {
  const dir = join(root, `run ${++made}`);
  mkdirSync(dir, { recursive: true });
  return dir;
};
// Each picture the data names, made as a small file under the folder the page goes to, but those to skip.
const picturesOf = data => [...data.options, ...(data.gallery?.items ?? [])].flatMap(shown => shown.images ?? []);
const placePictures = (folder, data, skip = []) => {
  for (const image of picturesOf(data).filter(image => !skip.includes(image))) {
    mkdirSync(dirname(join(folder, image)), { recursive: true });
    writeFileSync(join(folder, image), 'a picture');
  }
};
const writeData = (dir, data) => {
  const file = join(dir, 'the decision.json');
  writeFileSync(file, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  return file;
};

// ---- the pictures, as Chrome shows them

// A PNG of one grey, of the size asked: the signature, then IHDR, the rows deflated and IEND, each chunk
// with its CRC (written here: zlib.crc32 is newer than the Node the package names).
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = bytes => {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const pngChunk = (type, data) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};
const greyPng = (width, height) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // eight bits a pixel, greyscale
  const row = Buffer.alloc(width + 1, 0x99);
  row[0] = 0; // no filter
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([signature, pngChunk('IHDR', header), pngChunk('IDAT', deflateSync(Buffer.concat(Array(height).fill(row)))), pngChunk('IEND', Buffer.alloc(0))]);
};

test('in Chrome: the options in one row that scrolls on its own, one whole picture each, and the question in view wherever he scrolls', async () => {
  const dir = fresh();
  const data = sample();
  // Each wide picture 1280 by 1600, each phone picture (and the gallery's) 390 by 2400.
  for (const image of picturesOf(data)) {
    mkdirSync(dirname(join(dir, image)), { recursive: true });
    writeFileSync(join(dir, image), image.includes('-1280-') ? greyPng(1280, 1600) : greyPng(390, 2400));
  }
  const file = join(dir, 'decision.html');
  writeFileSync(file, renderDecision(data));
  const browser = await chromium.launch({ executablePath: findChrome(), headless: true });
  try {
    for (const width of [1440, 1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(pathToFileURL(file).href);
      const seen = await page.evaluate(() => {
        const box = element => element.getBoundingClientRect();
        const row = document.querySelector('.options .row');
        const question = document.querySelector('.question');
        const inView = () => box(question).top >= 0 && box(question).bottom <= innerHeight + 0.5;
        const seen = {
          overflow: document.documentElement.scrollWidth > innerWidth,
          last: document.body.lastElementChild === question,
          scrolls: getComputedStyle(row).overflowX === 'auto' && row.scrollWidth > row.clientWidth,
          options: [...row.children].map(option => ({ left: box(option).left, right: box(option).right, pictures: option.querySelectorAll('img').length })),
          pictures: [...document.images].map(img => ({
            src: img.getAttribute('src'),
            loaded: img.complete && img.naturalWidth > 0,
            link: img.parentElement.tagName === 'A' && img.parentElement.getAttribute('href') === img.getAttribute('src'),
            fit: getComputedStyle(img).objectFit,
            natural: [img.naturalWidth, img.naturalHeight],
            shown: [img.clientWidth, img.clientHeight],
          })),
          inView: [inView()],
        };
        for (const at of [0.5, 1]) {
          scrollTo(0, document.documentElement.scrollHeight * at);
          seen.inView.push(inView());
        }
        return seen;
      });
      assert.equal(seen.overflow, false, `${width}: the page itself never scrolls sideways`);
      assert.equal(seen.last, true, `${width}: the question is the last element of the body`);
      assert.deepEqual(seen.inView, [true, true, true], `${width}: the question is in view at the top, the middle and the end`);
      assert.equal(seen.scrolls, width < 1440, `${width}: the row of options scrolls sideways on its own only when it must`);
      assert.deepEqual(seen.options.map(option => option.pictures), [1, 1, 1], `${width}: one picture an option`);
      if (width === 1440) {
        const whole = seen.options.filter(option => option.left >= 0 && option.right <= width);
        assert.equal(whole.length, 3, `${width}: three options side by side, nothing cut: ${JSON.stringify(seen.options)}`);
      } else if (width === 1280) {
        const whole = seen.options.filter(option => option.left >= 0 && option.right <= width);
        assert.ok(whole.length >= 2, `${width}: two options side by side in the first screen: ${JSON.stringify(seen.options)}`);
      } else {
        assert.ok(seen.options[0].right - seen.options[0].left >= 0.85 * width, `${width}: one option takes close to the whole width`);
      }
      assert.equal(seen.pictures.length, 4);
      for (const { src, loaded, link, fit, natural, shown } of seen.pictures) {
        const at = `${width}: ${src}, shown ${shown.join('x')} of ${natural.join('x')}`;
        assert.ok(loaded && link && fit === 'fill', at);
        assert.ok(Math.abs(shown[1] - (shown[0] * natural[1]) / natural[0]) <= 1, `${at}: whole, never cropped`);
        assert.ok(shown[0] <= natural[0], `${at}: never blown up`);
        if (width > 390) assert.equal(shown[0], 390, `${at}: a phone picture at its own width`);
        else assert.ok(shown[0] >= 300, `${at}: as wide as the phone allows`);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
});

test('the CLI builds the approve sample and counts its open findings, and apart from them the deviations already accepted', () => {
  const dir = fresh();
  const input = writeData(dir, approveSample());
  placePictures(dir, approveSample());
  const out = join(dir, 'decision.html');
  const r = run(input, '--out', out);
  assert.deepEqual([r.status, r.stderr], [0, '']);
  assert.equal(r.stdout, `built ${out}: 1 option, 2 seats, 2 open findings, 1 accepted deviation, one question\n`);
  assert.match(readFileSync(out, 'utf8'), /<h2>Open findings<\/h2>[\s\S]*<h2>Accepted deviations<\/h2>/);
  // Counted apart: an accepted deviation is never an open finding, and none is not said.
  const counts = findings => {
    const folder = fresh();
    const data = { ...approveSample(), findings };
    placePictures(folder, data);
    const built = run(writeData(folder, data), '--out', join(folder, 'decision.html'));
    assert.deepEqual([built.status, built.stderr], [0, '']);
    return built.stdout.replace(/^built .*: /, '');
  };
  const [open, , accepted] = approveSample().findings;
  assert.equal(counts([accepted, { ...accepted, accepted: 'look' }]), '1 option, 2 seats, 2 accepted deviations, one question\n');
  assert.equal(counts([accepted, open]), '1 option, 2 seats, 1 open finding, 1 accepted deviation, one question\n');
  assert.equal(counts([open]), '1 option, 2 seats, 1 open finding, one question\n');
  assert.equal(counts([]), '1 option, 2 seats, one question\n');
});

test('the CLI builds the page from decision.json, in folders named with two words, and says where', () => {
  const dir = fresh();
  const input = writeData(dir, sample());
  const out = join(dir, 'the stage', 'decision page.html');
  placePictures(join(dir, 'the stage'), sample());
  const r = run(input, '--out', out);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
  assert.equal(r.stdout, `built ${out}: 3 options, a gallery of 1, 4 seats, one question\n`);
  assert.equal(readFileSync(out, 'utf8'), renderDecision(sample()));
  // --out=value is the same; a byte-order mark and CRLF line endings are read.
  const crlf = writeData(fresh(), `\uFEFF${JSON.stringify(sample(), null, 2).replace(/\n/g, '\r\n')}`);
  const again = join(dirname(crlf), 'decision.html');
  placePictures(dirname(crlf), sample());
  assert.equal(run(crlf, `--out=${again}`).status, 0);
  assert.equal(readFileSync(again, 'utf8'), renderDecision(sample()));
});

test('the CLI refuses invalid data with every error, exits 1, and writes nothing', () => {
  const dir = fresh();
  const data = changed(d => {
    d.question = 'Which one? And when?';
    d.recommendation.reason = 'It is first. It is fast.';
  });
  const out = join(dir, 'decision.html');
  const r = run(writeData(dir, data), '--out', out);
  assert.equal(r.status, 1);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, `cannot build the decision page from ${join(dir, 'the decision.json')}:\n${validateDecision(data).join('\n')}\n`);
  assert.match(r.stderr, /one question/);
  assert.match(r.stderr, /one sentence/);
  assert.ok(!existsSync(out));
});

test('the CLI exits 1 for an input it cannot read, and for an output it cannot write', () => {
  const dir = fresh();
  let r = run(join(dir, 'missing.json'), '--out', join(dir, 'decision.html'));
  assert.deepEqual([r.status, r.stderr], [1, `cannot read ${join(dir, 'missing.json')}: not found\n`]);
  r = run(writeData(dir, '{ "question": '), '--out', join(dir, 'decision.html'));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /^cannot read .*the decision\.json: it is not JSON/);
  const file = join(dir, 'a file');
  writeFileSync(file, 'x');
  // With no picture to find beside it, the page reaches the write, which a file in the path refuses.
  const unpictured = changed(d => {
    for (const option of d.options) delete option.images;
    delete d.gallery;
  });
  r = run(writeData(dir, unpictured), '--out', join(file, 'decision.html'));
  assert.deepEqual([r.status, r.stderr], [1, `cannot write ${join(file, 'decision.html')}: part of the path is a file, not a folder\n`]);
  assert.deepEqual(readdirSync(dir).sort(), ['a file', 'the decision.json']);
});

test('the CLI refuses a picture that is not a file beside the page, naming the first such, and writes nothing', () => {
  const dir = fresh();
  const input = writeData(dir, sample());
  const stage = join(dir, 'the stage');
  const out = join(stage, 'decision.html');
  const missing = (where, image, folder = stage) =>
    `cannot build the decision page from ${input}:\n${where}: the picture ${JSON.stringify(image)} is not a file in ${folder}\n`;
  // An option's picture and the gallery's are missing: the option's is named, the first in the page.
  placePictures(stage, sample(), ['shots/B-390-light.png', 'fresh/today-1.png']);
  let r = run(input, '--out', out);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', missing('options[1].images[0]', 'shots/B-390-light.png')]);
  assert.ok(!existsSync(out), 'nothing is written');
  // The gallery's alone.
  writeFileSync(join(stage, 'shots', 'B-390-light.png'), 'a picture');
  r = run(input, '--out', out);
  assert.deepEqual([r.status, r.stdout, r.stderr], [1, '', missing('gallery.items[0].images[0]', 'fresh/today-1.png')]);
  assert.ok(!existsSync(out), 'nothing is written');
  // A folder where the picture should be is no picture.
  mkdirSync(join(stage, 'fresh', 'today-1.png'), { recursive: true });
  r = run(input, '--out', out);
  assert.deepEqual([r.status, r.stderr], [1, missing('gallery.items[0].images[0]', 'fresh/today-1.png')]);
  assert.ok(!existsSync(out), 'nothing is written');
  // Once every picture is a file there, the page builds.
  rmSync(join(stage, 'fresh', 'today-1.png'), { recursive: true });
  writeFileSync(join(stage, 'fresh', 'today-1.png'), 'a picture');
  r = run(input, '--out', out);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(out));
  // Pictures are found from the page's folder, not from the data's: a page bound elsewhere finds none, and
  // its folder is not made.
  const elsewhere = join(dir, 'elsewhere');
  r = run(input, '--out', join(elsewhere, 'decision.html'));
  assert.deepEqual([r.status, r.stderr], [1, missing('options[0].images[0]', 'shots/A-390-light.png', elsewhere)]);
  assert.ok(!existsSync(elsewhere), 'nothing is made');
});

test('the CLI finds a picture in a folder whose name holds a space', () => {
  const dir = fresh();
  const data = changed(d => (d.options[0].images = ['two words/A 1280.png', 'shots/A-390-light.png']));
  const input = writeData(dir, data);
  placePictures(join(dir, 'the stage'), data);
  const out = join(dir, 'the stage', 'decision.html');
  const r = run(input, '--out', out);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(readFileSync(out, 'utf8').includes('<a class="picture" href="two words/A 1280.png"><img src="two words/A 1280.png" alt="Option A, picture 1 of 2"></a>'));
});

test('the CLI exits 2 for bad usage, with the usage, and writes nothing', () => {
  const dir = fresh();
  const input = writeData(dir, sample());
  const cases = [
    [[], 'page takes one <decision.json>, got 0'],
    [[input, input, '--out', join(dir, 'x.html')], 'page takes one <decision.json>, got 2'],
    [[input], '--out is missing'],
    [[input, '--out'], '--out needs a value'],
    [[input, '--out', join(dir, 'x.html'), '--kit', 'grey'], 'unknown flag --kit'],
    [[input, '--out', input], '--out is the decision data itself: building would overwrite it'],
  ];
  for (const [args, message] of cases) {
    const r = run(...args);
    assert.equal(r.status, 2, args.join(' '));
    assert.ok(r.stderr.startsWith(`${message}\n\nUsage: node scripts/page.mjs`), r.stderr);
    assert.equal(r.stdout, '');
  }
  assert.deepEqual(readdirSync(dir), ['the decision.json']);
  assert.deepEqual(JSON.parse(readFileSync(input, 'utf8')), sample());
});

test('the CLI prints its usage for --help and exits 0', () => {
  const r = run('--help');
  assert.equal(r.status, 0);
  assert.ok(r.stdout.startsWith('Usage: node scripts/page.mjs <decision.json> --out <decision.html>\n'));
  assert.match(r.stdout, /one question/);
  assert.ok(r.stdout.includes('"?", "\uFF1F" or "\u061F"'), 'every question mark is named');
  // R173: where the marks are counted, and where they are not.
  const help = r.stdout.replace(/\s+/g, ' ');
  assert.ok(help.includes('more than one question mark in the question and the reason of the recommendation together, each of "?"'), 'where a mark counts');
  assert.ok(help.includes('What a seat or a finding says, a title or a line may quote a question: no mark is counted there.'), 'where it does not');
  assert.doesNotMatch(help, /question mark in all/);
  // R186: the field, its heading and its sample.
  assert.ok(help.includes('A finding he has already accepted carries "accepted", the stage it was accepted at, as "accepted": "detail"'), 'the field');
  assert.ok(help.includes('under a heading of their own, "Accepted deviations", after the open findings, and are not counted as open'), 'the heading');
  assert.ok(help.includes(`when "accepted" is not a stage (${STAGES.join(', ')})`), 'the refusal');
  assert.match(r.stdout, /when a picture it names is not a file in the folder of --out/);
  assert.equal(r.stderr, '');
});
