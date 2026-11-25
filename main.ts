// Everyday Things, Two Lines, Longer Run — make.fun entry.
// Program writes exactly two lines to /output/entry.txt (the absolute
// output directory the grader provides, per the kit contract). If that
// absolute path is not writable (a plain local run with no /output),
// it falls back deterministically to output/ next to this script, so
// the entry still lands in the same place locally.
// Line 1 explains a toaster to a 10-year-old in one vivid sentence built
// on a single analogy (a campfire toasting a marshmallow on a stick).
// Line 2 says in one sentence what that analogy maps and what it leaves
// out. No wall-clock, no Date, no Math.random: the output is a constant
// string, so every run is byte-identical by construction.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LINE_1: string =
  "A toaster is a tiny campfire in a metal box that browns your bread the way a campfire browns a marshmallow on a stick.";
const LINE_2: string =
  "It maps the hot glow and the golden-brown finish, but it leaves out the smoke, the open flames, and the stick you hold in your own hand.";

const ENTRY: string = LINE_1 + "\n" + LINE_2;

// Gate: the sealed scorer accepts UTF-8 text of 1 to 400 characters.
const MAX_TOTAL_CHARS: number = 400;
const EXPECTED_LINES: number = 2;
// Pinned counts of the winning two lines, verified by two local runs:
// line 1 is 118 chars, line 2 is 136 chars, total 255 with the newline.
const EXPECTED_LINE_1_CHARS: number = 118;
const EXPECTED_LINE_2_CHARS: number = 136;
const EXPECTED_TOTAL_CHARS: number = 255;

// Absolute output directory the grader provides (kit contract:
// "the entry's program writes one text to /output/entry.txt").
// The grader mounts the repository read-only, so writing next to the
// script fails there with EROFS; the absolute path is the only writable
// target in the grading sandbox.
const PRIMARY_OUT_DIR: string = "/output";
const ENTRY_FILE_NAME: string = "entry.txt";

function isPureAscii(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (text.charCodeAt(i) > 127) {
      return false;
    }
  }
  return true;
}

function sentenceCount(line: string): number {
  let count = 0;
  for (let i = 0; i < line.length; i += 1) {
    const ch: string = line[i] as string;
    if (ch === "." || ch === "?" || ch === "!") {
      count += 1;
    }
  }
  return count;
}

function gate(entry: string): void {
  if (entry.length < 1 || entry.length > MAX_TOTAL_CHARS) {
    throw new Error("gate: total length out of range: " + String(entry.length));
  }
  const lines: string[] = entry.split("\n");
  if (lines.length !== EXPECTED_LINES) {
    throw new Error("gate: expected 2 lines, got " + String(lines.length));
  }
  if ((lines[0] as string).length !== EXPECTED_LINE_1_CHARS) {
    throw new Error("gate: line 1 length changed: " + String((lines[0] as string).length));
  }
  if ((lines[1] as string).length !== EXPECTED_LINE_2_CHARS) {
    throw new Error("gate: line 2 length changed: " + String((lines[1] as string).length));
  }
  if (entry.length !== EXPECTED_TOTAL_CHARS) {
    throw new Error("gate: total length changed: " + String(entry.length));
  }
  for (const line of lines) {
    if (line.length === 0) {
      throw new Error("gate: empty line");
    }
    if (line !== line.trim()) {
      throw new Error("gate: line has leading or trailing whitespace");
    }
    if (sentenceCount(line) !== 1) {
      throw new Error("gate: line is not exactly one sentence: " + line);
    }
  }
  if (!isPureAscii(entry)) {
    throw new Error("gate: entry is not pure ASCII");
  }
  if (entry.trim() !== entry) {
    throw new Error("gate: entry has surrounding whitespace");
  }
}

function writeEntry(entry: string): void {
  try {
    mkdirSync(PRIMARY_OUT_DIR, { recursive: true });
    writeFileSync(join(PRIMARY_OUT_DIR, ENTRY_FILE_NAME), entry, "utf8");
    return;
  } catch (primaryError) {
    // Local runs have no writable /output, so a failure here is
    // expected outside the grader; fall through to the repo-relative
    // directory instead of exiting with an error.
    console.log(
      "primary /output write failed (" +
        (primaryError as Error).message +
        "); using repo-relative output/ fallback",
    );
  }
  const here: string = dirname(fileURLToPath(import.meta.url));
  const fallbackDir: string = join(here, "output");
  mkdirSync(fallbackDir, { recursive: true });
  // No trailing newline: the pinned character counts are the file bytes.
  writeFileSync(join(fallbackDir, ENTRY_FILE_NAME), entry, "utf8");
}

function main(): void {
  gate(ENTRY);
  writeEntry(ENTRY);
  console.log("line1_chars=" + String(LINE_1.length));
  console.log("line2_chars=" + String(LINE_2.length));
  console.log("total_chars=" + String(ENTRY.length));
  console.log("lines=2 ok");
}

main();
