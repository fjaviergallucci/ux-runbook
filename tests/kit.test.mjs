// The grey kit, drawn: what only a browser can say of it. The kit's two samples (tests/fixtures/render: the
// kind one, and the same desk on its worst day) are drawn by the drawing script, with the proposal's own
// account and without it, and each page is opened at the primary width and at the phone width and measured
// where it stands. Nothing here reads a picture: a fault a person would see is said as a number.
// The pages are opened the one way every script of the kit opens a page (scripts/lib/browser.mjs): headless,
// in the machine's own Chrome, one browser at a time, reduced motion set; every browser the run started is
// gone when it ends. The pages are opened once, before the tests, and each test reads what was measured.
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visitPages } from '../scripts/lib/browser.mjs';
import { findChrome } from '../scripts/lib/chrome.mjs';
import { renderProposal } from '../scripts/render.mjs';

const here = dirname(fileURLToPath(import.meta.url));
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'kit-'));
after(() => rmSync(root, { recursive: true, force: true }));

const load = name => JSON.parse(readFileSync(join(here, 'fixtures', 'render', `${name}.json`), 'utf8'));
const WIDE = 1280;
const NARROW = 390;
// Each page drawn: the sample and the hard sample, for the founder and the judges, and for an audience.
const PAGES = {
  sample: { proposal: 'front-desk', notes: true },
  hard: { proposal: 'front-desk-hard', notes: true, lang: 'en' },
  'hard-screens': { proposal: 'front-desk-hard', notes: false },
  // The hard sample with two of its screens at places far along the navigation: the fourth and the last.
  far: {
    proposal: 'front-desk-hard',
    notes: false,
    change: proposal => {
      proposal.screens[2].title = 'Practitioners and their substitutes';
      proposal.screens[3].title = 'Day sheet';
    },
  },
};

// What is measured on a page, in the page: every length in CSS pixels, from the top left of the document.
const measure = () => {
  const box = element => {
    const r = element.getBoundingClientRect();
    return { top: r.top + scrollY, bottom: r.bottom + scrollY, left: r.left, right: r.right, width: r.width, height: r.height };
  };
  const inner = element => {
    const r = box(element);
    const s = getComputedStyle(element);
    return { left: r.left + parseFloat(s.borderLeftWidth) + parseFloat(s.paddingLeft), right: r.right - parseFloat(s.borderRightWidth) - parseFloat(s.paddingRight) };
  };
  const kind = element => [...element.classList].at(-1) ?? element.tagName.toLowerCase();
  // Runs of the same part written one after another, with no other element between two of them.
  const runsOf = selector => {
    const runs = [];
    for (const first of document.querySelectorAll(selector)) {
      if (first.previousElementSibling?.matches(selector)) continue;
      const run = [first];
      while (run.at(-1).nextElementSibling?.matches(selector)) run.push(run.at(-1).nextElementSibling);
      if (run.length > 1) runs.push({ holder: kind(first.parentElement), inside: inner(first.parentElement), boxes: run.map(box), screen: first.closest('[data-screen]').dataset.screen });
    }
    return runs;
  };
  const lineHeight = element => parseFloat(getComputedStyle(element).lineHeight);
  const TEXT = '.ux-heading, .ux-text, .ux-action, .ux-status, .ux-link, .ux-note, .ux-input, .ux-media, .ux-over, li, header:not(.ux-option):not(.ux-frame > header), summary, h1, h2, b, dt, dd';
  const narrowBar = element => innerWidth < 800 && element.closest('.ux-navigation') !== null;
  return {
    width: innerWidth,
    wide: document.documentElement.scrollWidth > innerWidth,
    lang: document.documentElement.lang,
    body: { overflowWrap: getComputedStyle(document.body).overflowWrap, wordBreak: getComputedStyle(document.body).wordBreak, hyphens: getComputedStyle(document.body).hyphens },
    windows: [...document.querySelectorAll('.ux-window')].map(box),
    mains: [...document.querySelectorAll('.ux-main')].map(main => ({ box: box(main), inside: inner(main) })),
    actions: runsOf('.ux-action'),
    groups: runsOf('.ux-region > .ux-group'),
    statuses: [...document.querySelectorAll('.ux-status')].map(status => ({ holder: kind(status.parentElement), width: box(status).width, inside: inner(status.parentElement), letters: status.textContent.length })),
    navigations: [...document.querySelectorAll('.ux-navigation')].map(area => {
      const style = getComputedStyle(area);
      return {
        box: box(area),
        window: box(area.closest('.ux-window')),
        places: [...area.querySelectorAll('.ux-nav > ul > li')].map(box),
        current: [...area.querySelectorAll('.ux-nav > ul > li[aria-current]')].map(box),
        moved: area.scrollLeft,
        parts: [...area.children].map(box),
        more: area.scrollWidth > area.clientWidth + 1,
        clipped: style.overflowX !== 'visible',
        fades: (style.maskImage || style.webkitMaskImage || 'none') !== 'none',
      };
    }),
    overview: (() => {
      const overview = document.querySelector('.ux-overview');
      if (!overview) return null;
      return {
        box: box(overview),
        titles: [...overview.querySelectorAll('b')].map(title => ({ lines: Math.round(box(title).height / lineHeight(title)), cut: title.scrollWidth > title.clientWidth + 1, ellipsis: getComputedStyle(title).textOverflow })),
        lists: [...overview.querySelectorAll('dl')].map(list => getComputedStyle(list).display),
        lines: [...overview.querySelectorAll('dd')].map(line => ({
          shown: line.getClientRects().length > 0,
          lines: Math.round(box(line).height / lineHeight(line)),
          cut: line.scrollHeight > line.clientHeight + 1 || line.scrollWidth > line.clientWidth + 1,
          clamp: getComputedStyle(line).webkitLineClamp,
          words: line.textContent,
        })),
      };
    })(),
    // A part whose words are wider than the part: it must show that it was cut.
    cut: [...document.querySelectorAll(TEXT)].filter(part => part.getClientRects().length > 0 && part.scrollWidth > part.clientWidth + 1 && !narrowBar(part)).map(part => ({
      part: kind(part),
      words: part.textContent.trim().slice(0, 60),
      ellipsis: getComputedStyle(part).textOverflow,
      hidden: getComputedStyle(part).overflowX,
    })),
    // A part that reaches past the window it is drawn in (a narrow navigation is cut there on purpose).
    spills: [...document.querySelectorAll('.ux-window *')].filter(part => !narrowBar(part) && part.getClientRects().length > 0 && box(part).right > box(part.closest('.ux-window')).right + 0.5).map(kind),
  };
};

// facts.get(`${name} ${width}`) → what was measured on that page at that width.
const facts = new Map();
before(async () => {
  copyFileSync(join(here, '..', 'kit', 'grey', 'kit.css'), join(root, 'kit.css'));
  const files = new Map();
  for (const [name, { proposal, notes, lang, change }] of Object.entries(PAGES)) {
    const file = join(root, `${name}.html`);
    const said = load(proposal);
    change?.(said);
    writeFileSync(file, renderProposal(said, { letter: 'A', notes, lang }));
    files.set(file, name);
  }
  const act = { run: page => page.evaluate(measure), failed: 'the page could not be measured', during: ' while it was being measured', unread: 'the page could not be read again once measured' };
  const runs = [WIDE, NARROW].map(width => ({ width, theme: 'light', files: [...files.keys()] }));
  await visitPages(findChrome(), runs, { act, Refusal: Error }, (file, visit, run) => {
    assert.ok(!visit.lost && !visit.fault, `${files.get(file)} at ${run.width}: ${visit.fault ?? 'the browser stopped'}`);
    assert.deepEqual(visit.reports, [], `${files.get(file)} at ${run.width}`);
    facts.set(`${files.get(file)} ${run.width}`, visit.value);
  });
});
const at = (name, width) => facts.get(`${name} ${width}`);
const every = () => Object.keys(PAGES).flatMap(name => [WIDE, NARROW].map(width => [`${name} at ${width}`, at(name, width)]));
const near = (a, b, by = 1) => Math.abs(a - b) <= by;

test('every page is as wide as its screen and no wider, and no part reaches past its window', () => {
  for (const [name, page] of every()) {
    assert.equal(page.wide, false, `${name}: the page is wider than the screen`);
    assert.deepEqual(page.spills, [], `${name}: parts past their window`);
  }
});

// I1 of the board change's review: actions that follow one another sit side by side everywhere: in a
// region as in a group, a dialog or a screen that places nothing. One rule for the class.
test('actions written one after another share a line wherever they are, a gap apart that is the same in every holder', () => {
  const runs = [...at('hard', WIDE).actions, ...at('sample', WIDE).actions];
  const holders = new Set(runs.map(run => run.holder));
  for (const holder of ['ux-main', 'ux-group', 'ux-dialog', 'ux-screen']) assert.ok(holders.has(holder), `a run of actions in a ${holder} is drawn`);
  const gaps = [];
  for (const { holder, boxes, screen } of runs) {
    for (const [i, action] of boxes.entries()) {
      if (i === 0) continue;
      assert.ok(near(action.top, boxes[0].top), `${screen}, in a ${holder}: an action sits ${action.top - boxes[0].top} px under the one before it`);
      assert.ok(action.left > boxes[i - 1].right, `${screen}, in a ${holder}: after it, not over it`);
      gaps.push(action.left - boxes[i - 1].right);
    }
  }
  assert.ok(gaps.length >= 5, `${gaps.length} pairs`);
  assert.ok(Math.max(...gaps) - Math.min(...gaps) <= 1.5, `the gap between two actions is the same wherever they are: ${gaps.map(gap => gap.toFixed(1)).join(', ')}`);
  assert.ok(gaps.every(gap => gap >= 6 && gap <= 16), `a gap, not a touch and not a hole: ${gaps[0]}`);
  // Narrow, a run that fits its holder still shares a line; one that does not goes on to the next, whole.
  for (const { holder, boxes, inside, screen } of at('hard', NARROW).actions) {
    const fits = boxes.reduce((sum, action) => sum + action.width, 0) + gaps[0] * (boxes.length - 1) <= inside.right - inside.left;
    assert.equal(near(boxes.at(-1).top, boxes[0].top), fits, `${screen}, in a ${holder}, at ${NARROW}`);
    for (const action of boxes) assert.ok(action.right <= inside.right + 0.5, `${screen}: an action stays in its ${holder}`);
  }
});

test('a status is as wide as its words on a line of its own, in a region as anywhere', () => {
  for (const [name, page] of every()) {
    // One short enough to fit its holder's line: a longer one runs to the holder's edge and on to a second line.
    for (const { holder, width, inside } of page.statuses.filter(status => status.holder !== 'ux-bar' && status.letters <= 24)) {
      assert.ok(width < inside.right - inside.left - 20, `${name}: a status fills its ${holder}`);
    }
  }
  assert.ok(at('hard', WIDE).statuses.some(status => status.holder === 'ux-beside') && at('sample', WIDE).statuses.some(status => status.holder === 'ux-main'));
});

test('groups written one after another in a region sit two to a row where there is room, edge to edge, and one under another where there is not', () => {
  const [run] = at('hard', WIDE).groups.filter(group => group.screen === 'rooms');
  assert.equal(run.boxes.length, 3);
  const [first, second, third] = run.boxes;
  assert.ok(near(first.top, second.top), 'the first two share a row');
  assert.ok(near(first.width, second.width, 2), 'at one width');
  assert.ok(near(first.left, run.inside.left) && near(second.right, run.inside.right, 2.5), `from edge to edge of the region: ${second.right} of ${run.inside.right}`);
  const gap = second.left - first.right;
  assert.ok(gap >= 8 && gap <= 16, `a gap apart: ${gap}`);
  assert.ok(third.top > Math.max(first.bottom, second.bottom) && near(third.left, first.left), 'the third starts the next row');
  assert.ok(near(third.top - Math.max(first.bottom, second.bottom), gap, 4), 'a row apart as a card is from the next');
  // The kind sample's two cards too, in a region inside the main part.
  const [cards] = at('sample', WIDE).groups;
  assert.ok(near(cards.boxes[0].top, cards.boxes[1].top) && near(cards.boxes[1].right, cards.inside.right, 2.5));
  // Narrow, each takes the region's whole width.
  for (const { boxes, inside } of at('hard', NARROW).groups) {
    for (const [i, group] of boxes.entries()) {
      assert.ok(near(group.left, inside.left) && near(group.right, inside.right, 1.5), 'the whole width');
      if (i) assert.ok(group.top > boxes[i - 1].bottom, 'under the one before');
    }
  }
});

test('wide, the main part is as wide as a line reads well, however much room the screen leaves it', () => {
  const mains = at('hard', WIDE).mains;
  for (const { inside } of mains) assert.ok(inside.right - inside.left <= 46 * 16 + 1, `a main part ${inside.right - inside.left} px wide inside`);
  assert.ok(mains.some(({ box: area }) => area.width > 900), 'on a screen with nothing beside it, the area is wider than what it holds');
  assert.ok(mains.some(({ box: area, inside }) => area.width < 800 && inside.right - inside.left > 600), 'and with something beside it, it has what is left');
});

// M2 of the review: narrow, the navigation is one bar. Its places are one row; what does not fit is shown to
// continue; the name above them and the nav's caption take no row of their own.
test('narrow, the navigation is one bar: its places in one row, everything it holds on that row, and what does not fit cut at the edge with a fade', () => {
  for (const name of ['hard', 'hard-screens', 'sample', 'far']) {
    const navigations = at(name, NARROW).navigations;
    assert.ok(navigations.length >= 3, name);
    for (const navigation of navigations) {
      assert.ok(navigation.box.height <= 56, `${name}: the bar is ${navigation.box.height} px high`);
      assert.ok(near(navigation.box.left, navigation.window.left, 1.5) && near(navigation.box.right, navigation.window.right, 1.5), `${name}: across the window`);
      for (const place of navigation.places) assert.ok(near(place.top, navigation.places[0].top), `${name}: the places are one row`);
      for (const part of navigation.parts) assert.ok(part.top >= navigation.box.top && part.bottom <= navigation.box.bottom, `${name}: every part is on the bar's one row`);
      assert.ok(navigation.clipped && navigation.fades, `${name}: what does not fit is cut, with a fade`);
    }
  }
  // The hard sample's five long places do not fit: the bar holds more than it shows, and the first place is whole.
  const [bar] = at('hard', NARROW).navigations;
  assert.ok(bar.more, 'more than fits');
  assert.ok(bar.places[0].right <= bar.box.right - 24, 'the first place is in sight, whole');
  assert.ok(bar.places.at(-1).left > bar.box.right, 'the last is past the edge');
  // The place she is at is in sight on the bar, whole and clear of the fade, wherever it is in the row; the row
  // stands at its start whenever that place is in sight from there.
  for (const name of ['hard', 'hard-screens', 'sample', 'far']) {
    for (const [i, navigation] of at(name, NARROW).navigations.entries()) {
      assert.equal(navigation.current.length, 1, `${name}, navigation ${i + 1}: one place is marked`);
      const [current] = navigation.current;
      assert.ok(current.left >= navigation.box.left + 12 && current.right <= navigation.box.right - 31, `${name}, navigation ${i + 1}: the marked place is at ${current.left} to ${current.right} of ${navigation.box.left} to ${navigation.box.right}`);
    }
  }
  const [today, rooms, bookings] = at('sample', NARROW).navigations;
  assert.deepEqual([today.moved, rooms.moved], [0, 0], 'the kind sample\'s first two rows stand at their start: the place is in sight from there');
  assert.ok(bookings.moved > 0 && bookings.moved < 120, `its third comes along only as far as its place needs: ${bookings.moved}`);
  assert.equal(at('hard', NARROW).navigations[0].moved, 0, 'and the hard sample\'s first, whose place is its first');
  const [, fourth, last] = at('far', NARROW).navigations;
  assert.ok(fourth.moved > 100 && last.moved > 100, `the far places bring the row along: ${fourth.moved}, ${last.moved}`);
  // Wide, the same navigation is a column at the side: its places one under another, from the window's edge.
  for (const name of ['hard', 'sample']) {
    for (const navigation of at(name, WIDE).navigations) {
      assert.ok(near(navigation.box.left, navigation.window.left, 1.5) && navigation.box.width < 260, `${name}: a column at the side`);
      for (const [i, place] of navigation.places.entries()) {
        if (i) assert.ok(place.top >= navigation.places[i - 1].bottom && near(place.left, navigation.places[0].left), `${name}: one place under another`);
      }
      assert.equal(navigation.fades, false, `${name}: nothing is faded in the column`);
    }
  }
});

// M1 of the review, and the controller's ruling on it: at 1280 a line of the overview may run to two lines and
// then ends with an ellipsis; at a narrow width the overview is each screen's title alone, one short line each.
test('the overview: wide, each area in two lines at most, a longer one ending with an ellipsis; narrow, each screen\'s title alone on one line', () => {
  const wide = at('hard', WIDE).overview;
  assert.ok(wide.lists.every(display => display !== 'none') && wide.lines.every(line => line.shown), 'wide, what each area holds is said');
  for (const line of wide.lines) {
    assert.ok(line.lines <= 2, `${line.lines} lines: ${line.words}`);
    if (line.cut) assert.equal(line.clamp, '2', `cut with no ellipsis: ${line.words}`);
  }
  assert.ok(wide.lines.some(line => line.lines === 2) && wide.lines.some(line => line.cut), 'the hard sample has a line of two lines, and one that is cut');
  assert.ok(at('sample', WIDE).overview.lines.every(line => line.lines <= 2));
  for (const name of ['hard', 'sample']) {
    const narrow = at(name, NARROW).overview;
    assert.ok(narrow.lists.every(display => display === 'none') && narrow.lines.every(line => !line.shown), `${name}: narrow, no area is said`);
    for (const title of narrow.titles) {
      assert.equal(title.lines, 1, `${name}: a title on one line`);
      if (title.cut) assert.equal(title.ellipsis, 'ellipsis', name);
    }
    assert.ok(narrow.box.height <= narrow.titles.length * 26 + 12, `${name}: ${narrow.titles.length} titles in ${narrow.box.height} px`);
  }
  assert.equal(at('hard-screens', WIDE).overview, null, 'and none at all on the audience\'s page');
});

test('the first window is on the first screen: at 390 on the founder\'s page under its title and overview, and right under the title on the audience\'s', () => {
  const first = (name, width) => at(name, width).windows[0].top;
  assert.ok(first('hard', NARROW) <= 330, `the hard sample at ${NARROW}: ${first('hard', NARROW)}`);
  assert.ok(first('sample', NARROW) <= 330, `the sample at ${NARROW}: ${first('sample', NARROW)}`);
  assert.ok(first('hard-screens', NARROW) <= 130 && first('hard-screens', WIDE) <= 130, 'the audience\'s page begins with its first window');
  // Wide, the overview says what each area holds, in two lines each: the first window is still in the upper half.
  assert.ok(first('hard', WIDE) <= 450, `the hard sample at ${WIDE}: ${first('hard', WIDE)}`);
  // And the main part of the first screen begins on the first screen at 390, under one bar and one navigation bar.
  const [bar] = at('hard-screens', NARROW).navigations;
  assert.ok(bar.box.bottom <= 330, `the audience meets the main part at ${bar.box.bottom} px`);
});

// M3 of the review: a long word never breaks in the middle without a sign. The page asks the browser to hyphenate
// (it does where it knows the page's language); a word it cannot break moves to a line of its own, and one
// longer than its line is cut with an ellipsis.
test('a long word is never broken in the middle without a sign: the page hyphenates where the browser can, and a part its words do not fit is cut with an ellipsis', () => {
  for (const [name, page] of every()) {
    assert.deepEqual(page.body, { overflowWrap: 'normal', wordBreak: 'normal', hyphens: 'auto' }, name);
    for (const part of page.cut) assert.deepEqual([part.ellipsis, part.hidden], ['ellipsis', 'hidden'], `${name}: ${part.part} is cut with no sign: ${part.words}`);
  }
  assert.equal(at('hard', WIDE).lang, 'en');
  assert.equal(at('sample', WIDE).lang, '');
  // The hard sample's longest words are cut somewhere at each width, so the rule is met, not passed by.
  assert.ok(at('hard-screens', WIDE).cut.some(part => part.part === 'ux-heading'), 'the long name in the navigation column');
  assert.ok(at('hard-screens', NARROW).cut.some(part => part.part === 'li'), 'a row of the list at the phone width');
});
