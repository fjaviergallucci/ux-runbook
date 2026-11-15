// What a mount or an operating system leaves in a folder that nobody wrote there: the name a mount keeps
// for a file that was removed while it was still open (.fuse_hidden…), and what a file browser leaves
// where it has looked (.DS_Store, Thumbs.db, desktop.ini). A check that a folder is empty, or holds
// exactly certain files, passes them over, and so does a record of what a folder held: none of them is
// ever read as a letter, a picture or a file of a stage. One list, for every script that asks.
export const LEFTOVER = /^(?:\.fuse_hidden.*|\.DS_Store|Thumbs\.db|desktop\.ini)$/;

// isLeftover(name) → whether a file's own name (never a path) is one of them.
export const isLeftover = name => LEFTOVER.test(name);
