// The carry list (spec § 6): the last section of a stage output, headed `## Carry`. Each entry names a
// section of an earlier output this one is built from, at that output's current version
// (`- stage@version#heading-slug`), or a project source (`- source:path`), which is accepted without
// resolving: the project root is not the package's to know. The checks here read text only; the package
// is reached through the `context` that scripts/lib/state.mjs passes in.

const SECTION_ENTRY = /^- ([a-z]+)@(\d+)#(\S+)$/;
const SOURCE_ENTRY = /^- source:\s*\S/;
const HEADING = /^#{1,6}[ \t]+(.+?)[ \t]*$/;
const CARRY_HEADING = /^##[ \t]+Carry[ \t]*$/;

// A heading's slug: lower-cased, every run of characters that are not letters or digits made one `-`,
// trimmed of `-`. Letters and digits of any script count: `Qué puede mostrar` is `qué-puede-mostrar`.
export function slug(heading) {
  return heading.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
}

const slugsOf = body => body.split('\n').map(line => HEADING.exec(line)).filter(Boolean).map(match => slug(match[1]));

// context: { stage, file, required, earlier(stage) → boolean, inputs: the stages in built-from,
//            earlierBody(stage, version) → { body, file } or { code, message } }
export function carryProblems(body, context) {
  const lines = body.split('\n');
  const start = lines.findLastIndex(line => CARRY_HEADING.test(line));
  if (start === -1) {
    if (!context.required) return [];
    return [{ code: 'carry-unresolved', message: `${context.file} has no "## Carry" section; it is the last section of every output from frame to look` }];
  }
  const out = [];
  const unresolved = message => out.push({ code: 'carry-unresolved', message });
  for (const line of lines.slice(start + 1).map(l => l.trim()).filter(Boolean)) {
    if (HEADING.test(line)) {
      unresolved(`"## Carry" must be the last section, but "${line}" follows it`);
      continue;
    }
    if (SOURCE_ENTRY.test(line)) continue;
    const match = SECTION_ENTRY.exec(line);
    if (!match) {
      unresolved(`"${line}" is not a carry entry; write - <stage>@<version>#<heading-slug> or - source:<path>`);
      continue;
    }
    const [, from, version, wanted] = match;
    if (!context.earlier(from)) {
      unresolved(`"${line}" names ${from}, which is not an earlier stage`);
      continue;
    }
    if (!context.inputs.includes(from)) {
      unresolved(`"${line}" names ${from}, which ${context.stage} is not built from; add it to built-from`);
      continue;
    }
    const found = context.earlierBody(from, Number(version));
    if (found.code) {
      out.push({ code: found.code, message: `"${line}": ${found.message}` });
      continue;
    }
    if (!slugsOf(found.body).includes(wanted.normalize('NFC'))) unresolved(`"${line}": ${found.file} has no heading whose slug is "${wanted}"`);
  }
  return out;
}
