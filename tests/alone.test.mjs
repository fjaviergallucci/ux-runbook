// alone: proves that a folder stands alone. Every address its pages and stylesheets load (href, src, srcset,
// url() and @import) must lead to a file inside the folder: one that leaves it, is remote or is not there is
// printed, and the command exits 1.
import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AloneError, alone, references } from '../scripts/alone.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const cli = join(here, '..', 'scripts', 'alone.mjs');
mkdirSync(join(here, '.tmp'), { recursive: true });
const root = mkdtempSync(join(here, '.tmp', 'alone-'));
after(() => rmSync(root, { recursive: true, force: true }));

// ---- what the tests are made of

let made = 0;
// A fresh folder of this run, holding the files given: each by its path from the folder, with its text.
const fresh = (files, name = `run ${++made}`) => {
  const dir = join(root, name);
  mkdirSync(dir, { recursive: true });
  for (const [file, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), text);
  }
  return dir;
};
const run = (cwd, ...args) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
const visible = name => !name.startsWith('.fuse_hidden');
const tree = (dir, inside = '') =>
  readdirSync(join(dir, inside), { withFileTypes: true }).filter(entry => visible(entry.name))
    .flatMap(entry => (entry.isDirectory() ? tree(dir, `${inside}${entry.name}/`) : [`${inside}${entry.name}`])).sort();
// A page with this in its head or body, and a stylesheet with these rules.
const page = body => `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Today</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
// A handoff folder in small: two pages of a prototype, the token file beside it, a font and a picture.
const FOLDER = Object.freeze({
  'tokens.css': '@import "fonts/faces.css";\n:root { --ground: #fff; }\nbody { background: url(img/paper.png); }\n',
  'fonts/faces.css': '@font-face { font-family: Desk; src: url("desk.woff2") format("woff2"); }\n',
  'fonts/desk.woff2': 'a font',
  'img/paper.png': 'a picture',
  'prototype/index.html': page('<link rel="stylesheet" href="../tokens.css">\n<a href="today-default-en.html">Today</a>'),
  'prototype/today-default-en.html': page('<link rel="stylesheet" href="../tokens.css">\n<img src="shots/today-default-en-390-light.png" alt="">\n<a href="index.html#top">Back</a>'),
  'prototype/shots/today-default-en-390-light.png': 'a picture',
});
// The folder with one more file, or one file changed.
const withFile = (file, text) => fresh({ ...FOLDER, [file]: text });
// The command's verdict on a folder, run from the folder above it with the folder named by its own name.
const judge = dir => run(dirname(dir), dir.slice(dirname(dir).length + 1));
// Exit 0, one line on standard output, nothing on standard error.
const stands = (dir, count) => {
  const r = judge(dir);
  assert.deepEqual([r.status, r.stderr], [0, ''], r.stdout);
  if (count) assert.match(r.stdout, count);
  return r.stdout;
};
// Exit 1, nothing on standard output, and on standard error one line for each reference that fails, then the count.
const fails = (dir, ...lines) => {
  const r = judge(dir);
  assert.deepEqual([r.status, r.stdout], [1, ''], r.stderr);
  const said = r.stderr.trimEnd().split('\n');
  assert.deepEqual(said.slice(0, -1), lines);
  assert.match(said.at(-1), new RegExp(`^${lines.length} reference${lines.length === 1 ? '' : 's'} of .+ ${lines.length === 1 ? 'does' : 'do'} not lead to a file inside it$`));
  assert.doesNotMatch(r.stderr, /^Usage:/m, 'a reference that fails is not bad usage');
};
// The one line a page prints for one thing in its body.
const inPage = body => withFile('prototype/today-empty-en.html', page(body));
const PAGE = 'prototype/today-empty-en.html';

// ---- the command line

test('--help prints the usage and exits 0: the form, every kind of reference that is read, what is passed over, what is never printed, and the exit codes', () => {
  for (const flag of ['--help', '-h']) {
    const r = run(root, flag);
    assert.deepEqual([r.status, r.stderr], [0, '']);
    assert.match(r.stdout, /^Usage: node scripts\/alone\.mjs <folder>\n/);
    for (const kind of ['href', 'xlink:href', 'src', 'srcset', 'imagesrcset', 'poster', 'the data of an object', 'url()', '@import', 'image-set()']) assert.ok(r.stdout.includes(kind), kind);
    assert.match(r.stdout, /every \.html and \.css file under the folder/);
    assert.match(r.stdout, /it leaves the folder/);
    assert.match(r.stdout, /it is remote/);
    assert.match(r.stdout, /the file is not there/);
    assert.match(r.stdout, /A fragment \(#x\), an address that is only a query \(\?x\), and a data:, mailto:, tel: or sms: address are\npassed over/);
    assert.match(r.stdout, /An address is printed without its query and its fragment, and without a sign-in written into it/);
    assert.match(r.stdout, /Exit codes: 0 every reference leads to a file inside the folder · 1 one does not, or a refusal .* · 2 bad usage\.\n$/s);
  }
});

test('bad usage exits 2 with the usage: no folder, two folders, a flag it does not know', () => {
  const dir = fresh(FOLDER);
  for (const [args, message] of [[[], /^alone takes one <folder>\n/], [[dir, dir], /^alone takes one <folder>\n/], [[dir, '--out', 'x'], /^unknown flag --out\n/], [['--strict', dir], /^unknown flag --strict\n/]]) {
    const before = tree(dir);
    const r = run(root, ...args);
    assert.deepEqual([r.status, r.stdout], [2, ''], r.stderr);
    assert.match(r.stderr, message);
    assert.match(r.stderr, /^Usage: node scripts\/alone\.mjs <folder>$/m);
    assert.deepEqual(tree(dir), before);
  }
});

test('a refusal exits 1 without the usage: a folder that is not there, a file in its place, a folder with no page and no stylesheet', () => {
  const dir = fresh({ 'notes.md': 'See [the kit](../kit/tokens.css).\n', 'data/strings.json': '{}\n' });
  for (const [name, message] of [['nowhere', /^cannot read nowhere: not found\n$/], [join(dir.slice(root.length + 1), 'notes.md'), /^cannot read .*notes\.md: it is a file, not a folder\n$/],
    [dir.slice(root.length + 1), /^.* holds no \.html and no \.css file: there is nothing to read\. Is it the folder that was meant\?\n$/]]) {
    const r = run(root, name);
    assert.deepEqual([r.status, r.stdout], [1, ''], r.stderr);
    assert.match(r.stderr, message);
    assert.doesNotMatch(r.stderr, /^Usage:/m);
  }
});

// ---- a folder that stands alone

test('a folder whose pages and stylesheets load only its own files stands alone: exit 0, and the count of what was read', () => {
  const dir = fresh(FOLDER);
  const before = tree(dir);
  const out = stands(dir);
  // Eight references in four files: the pages' two stylesheet links, their two links and a picture, and what the token file loads.
  assert.equal(out, `${dir.slice(root.length + 1)} stands alone: 8 references in 4 files, each to a file inside it\n`);
  assert.deepEqual(tree(dir), before, 'nothing is written');
  // As a module: the same count, and no fault.
  const found = alone(dir);
  assert.deepEqual([found.files, found.references, found.faults], [4, 8, []]);
});

test('a link between two pages of the folder is fine, from any depth, and a path with a space works written either way', () => {
  stands(fresh({
    'index.html': page('<a href="pages/free rooms.html">Free rooms</a>\n<a href="pages/free%20rooms.html">Again</a>\n<link rel="stylesheet" href="./kit/desk tokens.css">'),
    'pages/free rooms.html': page('<a href="../index.html">Back</a>\n<img src="../kit/shots/room%202.png" alt="">'),
    'kit/desk tokens.css': 'body { background: url("shots/room 2.png"); }\n',
    'kit/shots/room 2.png': 'a picture',
  }, 'a clinic with spaces'), /^a clinic with spaces stands alone: 6 references in 3 files/);
});

test('a fragment, a query alone, an empty address and a data:, mailto:, tel: or sms: address are passed over; a query and a fragment on a file of the folder are let be', () => {
  const dir = inPage(['<a href="#rooms">Rooms</a>', '<a href="">Here</a>', '<a href="mailto:desk@clinic.example">Write</a>', '<img src="data:image/png;base64,AAAA" alt="">',
    '<a href="index.html?room=2#top">Room 2</a>', '<img srcset="data:image/png;base64,AAAA 1x" alt="">', '<a href="tel:+34600000000">Call the desk</a>', '<a href="SMS:+34600000000">Text it</a>',
    '<a href="?lang=es">En español</a>', '<a href="?lang=es#rooms">Salas</a>'].join('\n'));
  // Passed over, they are not counted: the one counted is the link to the index.
  assert.equal(alone(dir).references, 8 + 1);
  stands(dir);
  stands(withFile('tokens.css', `${FOLDER['tokens.css']}a { background: url(data:image/svg+xml;utf8,<svg/>); mask: url(#clip); }\n`));
});

// ---- a reference that leaves the folder

test('a reference that climbs above the folder leaves it, in a page and in a stylesheet: the very link a copied page keeps', () => {
  // The page as Look wrote it, copied to the same depth: its link to the project's token file still resolves on disk.
  const project = fresh({ 'design/kit/tokens.css': ':root {}\n', 'design/today/07-handoff/prototype/today-default-en.html': page('<link rel="stylesheet" href="../../../kit/tokens.css">'), 'design/today/07-handoff/tokens.css': ':root {}\n' });
  const r = run(project, 'design/today/07-handoff');
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.equal(r.stderr, 'prototype/today-default-en.html: ../../../kit/tokens.css: it leaves the folder: ".." climbs above it\n1 reference of design/today/07-handoff does not lead to a file inside it\n');
  fails(inPage('<img src="../../logo.png" alt="">'), `${PAGE}: ../../logo.png: it leaves the folder: ".." climbs above it`);
  fails(withFile('tokens.css', ':root {}\nbody { background: url(../paper.png); }\n@import "../base.css";\n'), 'tokens.css: ../paper.png: it leaves the folder: ".." climbs above it', 'tokens.css: ../base.css: it leaves the folder: ".." climbs above it');
  // One level up from a page in a folder of the folder is still inside it; two are not.
  stands(inPage('<link rel="stylesheet" href="../tokens.css">'));
  fails(inPage('<link rel="stylesheet" href="../../tokens.css">'), `${PAGE}: ../../tokens.css: it leaves the folder: ".." climbs above it`);
  // Climbing out and coming back in by the folder's own name is leaving it all the same.
  const back = fresh(FOLDER, 'named');
  writeFileSync(join(back, PAGE), page('<link rel="stylesheet" href="../../named/tokens.css">'));
  fails(back, `${PAGE}: ../../named/tokens.css: it leaves the folder: ".." climbs above it`);
});

test('an absolute path and a file: address leave the folder, whatever they lead to', () => {
  const dir = fresh(FOLDER);
  const absolute = join(dir, 'tokens.css');
  writeFileSync(join(dir, PAGE), page(`<link rel="stylesheet" href="${absolute}">\n<img src="/img/paper.png" alt="">\n<a href="file://${absolute}">It</a>\n<img src="C:\\clinic\\logo.png" alt="">`));
  fails(dir, `${PAGE}: ${absolute}: it leaves the folder: an absolute path`, `${PAGE}: /img/paper.png: it leaves the folder: an absolute path`, `${PAGE}: file://${absolute}: it leaves the folder: a file: address`,
    `${PAGE}: C:\\clinic\\logo.png: it leaves the folder: an absolute path`);
});

test('a remote address is remote: http:, https:, and one that starts with two slashes', () => {
  fails(inPage('<script src="https://cdn.example/kit.js"></script>\n<link rel="stylesheet" href="//fonts.example/css?family=Desk">\n<img src="HTTP://clinic.example/logo.png" alt="">'),
    `${PAGE}: https://cdn.example/kit.js: it is remote`, `${PAGE}: //fonts.example/css (with a query): it is remote`, `${PAGE}: HTTP://clinic.example/logo.png: it is remote`);
  fails(withFile('tokens.css', '@import url("https://fonts.example/desk.css");\n:root {}\n'), 'tokens.css: https://fonts.example/desk.css: it is remote');
});

test('an address of another kind is not guessed at: it is printed', () => {
  fails(inPage('<a href="ftp://clinic.example/rooms.csv">Rooms</a>\n<a href="javascript:book()">Book</a>'), `${PAGE}: ftp://clinic.example/rooms.csv: an address of a kind this check does not know (ftp:)`,
    `${PAGE}: javascript:book(): an address of a kind this check does not know (javascript:)`);
});

test('a reference to a file that is not there is printed; a link to a folder of the folder is fine, and a folder is no file to load', () => {
  fails(inPage('<img src="shots/today-empty-en-390-light.png" alt="">\n<img src="shots/" alt="">\n<a href="today-default-es.html#rooms">Spanish</a>\n<a href="pictures/">No such folder</a>'),
    `${PAGE}: shots/today-empty-en-390-light.png: the file is not there`, `${PAGE}: shots/: the file is not there: it is a folder`, `${PAGE}: today-default-es.html: the file is not there`, `${PAGE}: pictures/: the file is not there`);
  // A link, an href, may lead to a folder inside the folder: the one it is in, one beside it, the folder itself.
  const linked = inPage('<a href="./">This folder</a>\n<a href="shots/">Pictures</a>\n<a href="../fonts">Fonts</a>\n<a href="..">The folder</a>\n<a href="../img/?sort=name">Sorted</a>');
  assert.equal(alone(linked).references, 8 + 5);
  stands(linked);
  // One that climbs out is still out, and a stylesheet does not load a folder.
  fails(inPage('<a href="../../">Above</a>'), `${PAGE}: ../../: it leaves the folder: ".." climbs above it`);
  fails(withFile('tokens.css', ':root {}\nbody { background: url(img/); }\n'), 'tokens.css: img/: the file is not there: it is a folder');
  fails(withFile('fonts/faces.css', '@font-face { font-family: Desk; src: url(desk.woff) format("woff"), url("desk.woff2") format("woff2"); }\n'), 'fonts/faces.css: desk.woff: the file is not there');
});

// ---- every way a reference is written

test('each attribute is read however it is quoted, and srcset candidate by candidate', () => {
  fails(inPage(["<img src='../../a.png' alt=''>", '<img src=../../b.png alt="">', '<IMG SRC = "../../c.png" alt="">', '<img alt="" srcset="shots/today-default-en-390-light.png 1x, ../../d.png 2x,../../e.png 3x">',
    '<source srcset="../../f.png">', '<a\n  href="../../g.html">G</a>'].join('\n')),
  ...['a.png', 'b.png', 'c.png', 'd.png', 'e.png', 'f.png', 'g.html'].map(name => `${PAGE}: ../../${name}: it leaves the folder: ".." climbs above it`));
  // A candidate may end at its comma; a value may have white space around it; a quoted value may hold a `>`; and the folder
  // above is ".." alone.
  fails(inPage('<img alt="" srcset="../../i.png, ../../j.png 2x">\n<a href="  ../../k.html  ">K</a>\n<a title="rooms > desks" href="../../l.html">L</a>\n<a href="../..">Up</a>'),
    ...['i.png', 'j.png', 'k.html', 'l.html'].map(name => `${PAGE}: ../../${name}: it leaves the folder: ".." climbs above it`), `${PAGE}: ../..: it leaves the folder: ".." climbs above it`);
  fails(fresh({ 'index.html': page('<a href="..">Up</a>\n<a href=".">Here</a>') }), 'index.html: ..: it leaves the folder: ".." climbs above it');
  // An attribute with no value does not end the reading of its tag.
  fails(inPage('<img hidden alt src="../../m.png">'), `${PAGE}: ../../m.png: it leaves the folder: ".." climbs above it`);
  // A backslash is a slash to a browser, and an svg's xlink:href is an href.
  fails(inPage('<img src="..\\..\\h.png" alt="">\n<svg><use xlink:href="../../z.svg#mark"/></svg>'), `${PAGE}: ..\\..\\h.png: it leaves the folder: ".." climbs above it`, `${PAGE}: ../../z.svg: it leaves the folder: ".." climbs above it`);
  // An attribute of another name that ends the same way is not one of the three.
  stands(inPage('<button data-href="../../x.html" data-src="../../y.png" data-go="today-default-en.html">Book</button>'));
});

test('a stylesheet written in a page is read as one: a style element, a style attribute, an import', () => {
  fails(inPage('<style>\n@import url(../../base.css);\n@import \'../../type.css\';\nbody { background: url( "../../paper.png" ); }\n</style>\n<p style="background-image: url(../../stamp.png)">Free</p>'),
    ...['base.css', 'type.css', 'paper.png', 'stamp.png'].map(name => `${PAGE}: ../../${name}: it leaves the folder: ".." climbs above it`));
});

test('what a comment holds is not loaded, and is not read; a base address is refused, since it moves every link of its page', () => {
  stands(inPage('<!-- <link rel="stylesheet" href="../../../kit/tokens.css"> -->\n<p>Free</p>'));
  stands(withFile('tokens.css', '/* was: @import "../base.css"; url(../paper.png) */\n:root {}\n'));
  fails(inPage('<base href="https://clinic.example/">\n<a href="index.html">Index</a>'), `${PAGE}: https://clinic.example/: a base address moves every link of the page: take it out`);
  fails(inPage('<base href="../">'), `${PAGE}: ../: a base address moves every link of the page: take it out`);
  // Whatever it says: one that names only a fragment is a base address all the same.
  fails(inPage('<base href="#top">'), `${PAGE}: : a base address moves every link of the page: take it out`);
});

test('an address written with character references is read as the browser reads it', () => {
  stands(fresh({ 'index.html': page('<a href="rooms&amp;desks.html">Rooms</a>\n<a href="rooms&#38;desks.html">Again</a>'), 'rooms&desks.html': page('<p>Free</p>') }));
  fails(fresh({ 'index.html': page('<a href="..&#47;kit&#x2F;tokens.css">Tokens</a>') }), 'index.html: ../kit/tokens.css: it leaves the folder: ".." climbs above it');
});

test('what does not leave the folder is not refused: an address inside another attribute\'s value, a style attribute written with character references, a comment in a style element, a tag in a script\'s text', () => {
  // The word src= inside a title is text, not an attribute.
  stands(inPage('<a title=\'the src="../../x.png" attribute, and href=../../y.html\' href="index.html">Index</a>'));
  assert.deepEqual(references('<a title=\'the src="../../x.png" attribute\' href="index.html">Index</a>', 'html'), ['index.html']);
  // A style attribute is decoded before it is read, as the browser decodes it.
  stands(inPage('<p style="background: url(&quot;shots/today-default-en-390-light.png&quot;)">Free</p>'));
  fails(inPage('<p style="background: url(&quot;../../paper.png&quot;)">Free</p>'), `${PAGE}: ../../paper.png: it leaves the folder: ".." climbs above it`);
  // A comment in a style element is passed over, as in a .css file; what follows it is read.
  stands(inPage('<style>\n/* was: url(../../old.png) and @import "../../old.css"; */\nbody { margin: 0; }\n</style>'));
  fails(inPage('<style>/* url(../../old.png) */ body { background: url(../../new.png); }</style>'), `${PAGE}: ../../new.png: it leaves the folder: ".." climbs above it`);
  // What a script holds is its text: a tag written in a string is no tag of the page. The script's own src is.
  stands(inPage('<script>const row = \'<a href="../../built-later.html">x</a>\'; const css = "url(../../later.png)";</script>'));
  fails(inPage('<script src="../../kit.js">const a = \'<img src="../../q.png">\';</script>'), `${PAGE}: ../../kit.js: it leaves the folder: ".." climbs above it`);
});

test('a poster, the data of an object, an imagesrcset and the strings of an image-set() are read too', () => {
  fails(inPage(['<video poster="../../still.png"></video>', '<object data="../../plan.svg"></object>', '<link rel="preload" as="image" imagesrcset="../../a.png 1x, ../../b.png 2x">', '<a data="../../not-read.html">An a has no data to load</a>',
    '<p style="background: image-set(&quot;../../c.png&quot; 1x, url(../../d.png) 2x)">Free</p>'].join('\n')),
  ...['still.png', 'plan.svg', 'a.png', 'b.png', 'c.png', 'd.png'].map(name => `${PAGE}: ../../${name}: it leaves the folder: ".." climbs above it`));
  fails(withFile('tokens.css', 'body { background: -webkit-image-set("../x.png" 1x, "img/paper.png" 2x); background: image-set(\'../y.avif\' type("image/avif"), "img/paper.png" 1x); }\n'),
    'tokens.css: ../x.png: it leaves the folder: ".." climbs above it', 'tokens.css: ../y.avif: it leaves the folder: ".." climbs above it');
});

test('a query, a fragment and a sign-in written into an address are never printed: a reference is named by its path, and the query is said in words', () => {
  // A made-up value, standing where a key rides in the address of a font or a picture.
  const SECRET = 'NOT-A-REAL-VALUE-7f3a';
  const dir = fresh({
    'tokens.css': `@import url("https://fonts.example/css?family=Desk&key=${SECRET}");\n@font-face { font-family: Desk; src: url("fonts/desk.woff2?v=${SECRET}#${SECRET}"); }\nbody { background: url(../paper.png?sig=${SECRET}); }\n`,
    'index.html': page(`<img src="https://desk:${SECRET}@clinic.example/logo.png" alt="">\n<a href="/rooms?token=${SECRET}">Rooms</a>\n<a href="missing.html#${SECRET}">Missing</a>\n<base href="https://clinic.example/?k=${SECRET}">\n<a href="ftp://desk:${SECRET}@clinic.example/rooms.csv?k=${SECRET}">File</a>`),
  });
  const r = judge(dir);
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.ok(!r.stderr.includes(SECRET) && !r.stdout.includes(SECRET), 'the value is in neither stream');
  assert.deepEqual(r.stderr.trimEnd().split('\n').slice(0, -1), [
    'index.html: https://clinic.example/logo.png (a sign-in taken out): it is remote', 'index.html: /rooms (with a query): it leaves the folder: an absolute path', 'index.html: missing.html: the file is not there',
    'index.html: https://clinic.example/ (with a query): a base address moves every link of the page: take it out', 'index.html: ftp://clinic.example/rooms.csv (with a query, a sign-in taken out): an address of a kind this check does not know (ftp:)',
    'tokens.css: https://fonts.example/css (with a query): it is remote', 'tokens.css: fonts/desk.woff2 (with a query): the file is not there', 'tokens.css: ../paper.png (with a query): it leaves the folder: ".." climbs above it']);
  // As a module too: what alone() hands back is what is printed.
  assert.ok(!JSON.stringify(alone(dir)).includes(SECRET));
  // A question mark after the # is part of the fragment: there is no query to speak of.
  fails(inPage('<a href="gone.html#rooms?free">Rooms</a>'), `${PAGE}: gone.html: the file is not there`);
  // Two addresses of one file that differ only by what is not printed are one line.
  fails(inPage(`<img src="gone.png?v=1" alt="">\n<img src="gone.png?v=2" alt="">`), `${PAGE}: gone.png (with a query): the file is not there`);
});

// ---- which files are read, and what is printed

test('every .html and .css file under the folder is read, whatever its depth and the case of its ending; no other file is', () => {
  const dir = fresh({ ...FOLDER, 'deep/er/page.HTML': page('<img src="../../../out.png" alt="">'), 'deep/print.Css': 'a { background: url(/abs.png); }\n', 'notes.md': '<a href="../../kit/tokens.css">not a page</a>\n',
    'data.json': '{ "href": "https://clinic.example" }\n', 'script.js': 'const css = "url(../../x.png)";\n', '.fuse_hidden0001.html': page('<a href="../../leftover.html">x</a>') });
  fails(dir, 'deep/er/page.HTML: ../../../out.png: it leaves the folder: ".." climbs above it', 'deep/print.Css: /abs.png: it leaves the folder: an absolute path');
});

test('every reference that fails is printed, file by file in the order of their paths and in the order written; one written twice in a file is printed once', () => {
  const dir = fresh({ 'b.html': page('<img src="../z.png" alt="">\n<img src="missing.png" alt="">\n<img src="../z.png" alt="">'), 'a.css': 'a { background: url(https://x.example/a.png); }\n', 'c/d.html': page('<a href="/root.html">Root</a>'), 'c.css': 'a { background: url(//x.example/c.png); }\n' });
  // The order is that of the paths as written, so a file comes before the folder of the same name.
  fails(dir, 'a.css: https://x.example/a.png: it is remote', 'b.html: ../z.png: it leaves the folder: ".." climbs above it', 'b.html: missing.png: the file is not there', 'c.css: //x.example/c.png: it is remote',
    'c/d.html: /root.html: it leaves the folder: an absolute path');
  const found = alone(dir);
  assert.deepEqual([found.files, found.references], [4, 5]);
  assert.deepEqual(found.faults[0], { file: 'a.css', reference: 'https://x.example/a.png', why: 'it is remote' });
});

test('a link in the folder that leads out of it leaves the folder', t => {
  const dir = fresh({ ...FOLDER, 'outside/kit.css': ':root {}\n' });
  const inside = join(dir, 'prototype');
  try {
    symlinkSync(join(dir, 'outside', 'kit.css'), join(inside, 'kit.css'));
  } catch {
    return t.skip('this system makes no symbolic links');
  }
  writeFileSync(join(inside, 'today-empty-en.html'), page('<link rel="stylesheet" href="kit.css">'));
  // Judged from the prototype folder alone, the link leads out of it; from the whole folder, it stays inside.
  const r = run(dir, 'prototype');
  assert.deepEqual([r.status, r.stdout], [1, '']);
  assert.match(r.stderr, /^today-empty-en\.html: kit\.css: it leaves the folder: a link that leads out of it$/m);
});

// ---- as a module

test('references(text, kind) lists what a page or a stylesheet loads, in the order written, each once', () => {
  assert.deepEqual(references('<link href="a.css"><img src=\'b.png\' srcset="c.png 1x, d.png 2x"><a href="a.css">again</a><p style="background: url(e.png)">', 'html'), ['a.css', 'b.png', 'c.png', 'd.png', 'e.png']);
  assert.deepEqual(references('@import "a.css";\n@import url(b.css) screen;\na { background: url( \'c.png\' ) } b { src: url(d.woff2) format("woff2") }', 'css'), ['a.css', 'b.css', 'c.png', 'd.woff2']);
  assert.deepEqual(references('<p>href="x" in words is not an attribute of a tag, and url(y) in words is no stylesheet</p>', 'html'), []);
  assert.deepEqual(references('<video poster="a.png"></video><object data="b.svg"></object><link rel="preload" as="image" imagesrcset="c.png 1x, d.png 2x"><a data="e.html">not an object</a>', 'html'), ['a.png', 'b.svg', 'c.png', 'd.png']);
  assert.deepEqual(references('a { background: image-set("a.png" 1x, url(b.png) 2x, \'c.avif\' type("image/avif")); } b { background: -webkit-image-set( "d.png" 1x ) } c { content: "e.png" }', 'css'), ['a.png', 'b.png', 'c.avif', 'd.png']);
  assert.deepEqual(references('', 'css'), []);
  assert.throws(() => references('a', 'js'), e => e instanceof TypeError && e.message === 'kind must be html or css; it is "js"');
  assert.throws(() => references(7, 'css'), e => e instanceof TypeError && e.message === 'text must be a string; it is 7');
});

test('alone(folder) throws an AloneError for a folder it cannot read, and a TypeError for anything that is not a path', () => {
  assert.throws(() => alone(join(root, 'nowhere')), e => e instanceof AloneError && /^cannot read .*nowhere: not found$/.test(e.message));
  for (const bad of [undefined, '', 7, null]) assert.throws(() => alone(bad), TypeError);
});
