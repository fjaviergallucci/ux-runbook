// Reading a JSON file: the one way every script reads one (a proposal, a letter, decision data), so that no
// two read the same file two ways. The bytes must be UTF-8; one leading byte-order mark (the Windows case) is
// dropped; the text must be JSON. Whether what it holds is valid is each format's question, not this one's.
// The wording of a file failure lives here too, so every script says it the same way.
import { readFileSync } from 'node:fs';

// One leading byte-order mark is dropped by the decoder itself; bytes that are not UTF-8 are refused.
const UTF8 = new TextDecoder('utf-8', { fatal: true });

// What a person can do something about, for the file failures that are common; any other keeps its own
// words.
export const REASONS = Object.freeze({
  ENOENT: 'not found',
  EISDIR: 'it is a folder, not a file',
  ENOTDIR: 'part of the path is a file, not a folder',
  EACCES: 'no permission',
  EPERM: 'no permission',
});

// reason(error) → why a file operation failed, in words a person can act on.
export const reason = e => (Object.hasOwn(REASONS, e.code) ? REASONS[e.code] : e.message);

// A file that could not be read as JSON; the message names the path and says why.
export class JsonFileError extends Error {}

// readJsonFile(path) → the parsed JSON. Throws a JsonFileError: `cannot read <path>: <why>`.
export function readJsonFile(path) {
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch (e) {
    throw new JsonFileError(`cannot read ${path}: ${reason(e)}`);
  }
  let text;
  try {
    text = UTF8.decode(bytes);
  } catch {
    throw new JsonFileError(`cannot read ${path}: it is not UTF-8`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new JsonFileError(`cannot read ${path}: it is not JSON (${e.message})`);
  }
}

// The names render and merge read a proposal by: the same reader, the same error.
export { JsonFileError as ProposalFileError, readJsonFile as readProposalFile };
