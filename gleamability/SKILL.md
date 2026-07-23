---
name: gleam-portability-analyzer
description: Scans a JS/TS codebase (or set of files) to find which files would benefit from being ported to Gleam and compiled back to JS, then writes Gleam sketches for the best candidates. Use this whenever the user asks to find "gleamable" files, wants to know which JS/TS modules are good candidates for porting to Gleam, mentions evaluating a codebase for Gleam migration, or asks for a Gleam rewrite/sketch of specific files. Trigger even if they just say something like "which of my files would be better in Gleam" or "help me start migrating to Gleam" without using the word "gleamable" explicitly.
---

# Gleam Portability Analyzer

Finds JS/TS files that are strong candidates for porting to [Gleam](https://gleam.run)
(a statically-typed functional language that compiles to JS) and produces a
ranked report plus Gleam sketches for the top candidates.

Two-stage workflow: a **fast deterministic scanner** does a first pass over
every file, then **Claude reviews the top-ranked files by hand** to confirm
the score, explain the reasoning, flag anything the scanner missed, and write
a Gleam sketch.

## Step 1 — Confirm scope

If not already clear from the request, confirm (don't over-ask — one
question is fine, default to reasonable choices):
- Target directory or list of files to scan (default: current project root
  the user is working in).
- Roughly how many top candidates they want sketches for (default: top 5).

## Step 2 — Run the scanner

The scanner is a zero-dependency Node script — no `npm install` needed.

```bash
node scripts/analyze.js <targetDir> --json /tmp/gleam-report.json --top 15
```

Options:
- `--top N` — how many results to print to stdout (the JSON always contains
  everything).
- `--json <path>` — write the full ranked report as JSON (recommended —
  read this back to get per-file signal breakdowns).
- `--ext .ts,.tsx,.js,.jsx` — restrict extensions if needed (defaults to all
  four).

The scanner ignores `node_modules`, `dist`, `build`, `out`, `.git`, `.next`,
`coverage`, `.turbo`, and `.d.ts` files automatically.

Each file gets a `score` (0–100), a `tier` (`Strong candidate` /
`Possible candidate` / `Low priority` / `Not a fit`), and lists of the
specific `positiveSignals` / `negativeSignals` / `disqualifiers` that drove
the score. Read `/mnt/skills/.../references/gleam-criteria.md` (path will be
under wherever this skill is installed) to understand *why* each signal
matters — you'll need that reasoning for step 3.

This is a heuristic regex-based pass, not a real parser — treat the ranking
as a strong prior, not ground truth. Files disqualified for JSX/dynamic-eval
reasons are correctly excluded almost all the time; borderline scores in the
40–70 range are where your own read of the file matters most.

## Step 3 — Review top candidates and explain

For each of the top N candidates (skip anything tiered `Not a fit`):
1. Open and actually read the file — don't just trust the score.
2. Confirm or correct the scanner's verdict in plain language: what the file
   does, which signals justify porting it, and anything the scanner couldn't
   see (see the "Reviewing top candidates" section of
   `references/gleam-criteria.md` for the checklist).
3. If a `Possible candidate` or borderline `Strong candidate` doesn't hold up
   on manual review, say so and drop or downgrade it rather than forcing a
   sketch.

## Step 4 — Write Gleam sketches for confirmed candidates

For each file that survives review, write a Gleam sketch demonstrating the
port: type definitions, function signatures, and the core logic translated
into idiomatic Gleam (pattern matching via `case`, `|>` pipelines, `Result`/
`Option` instead of null/throw). Use `references/gleam-syntax-cheatsheet.md`
for the JS/TS → Gleam mapping. This is a sketch to demonstrate feasibility
and rough shape, not a production-ready, fully compiling module — say so
explicitly, and call out any part that would need FFI (`@external`) to
existing JS or a genuine redesign (e.g. anything with mutation-in-a-loop that
becomes a fold).

If Gleam syntax specifics are uncertain (stdlib function names/signatures
change between versions), web-search the current Gleam documentation rather
than guessing from memory.

## Step 5 — Deliver the report

Produce a single Markdown report containing:
- A ranked table (file, score, tier, one-line reason) for everything above
  `Low priority`.
- For each top candidate: the explanation from Step 3 and the Gleam sketch
  from Step 4, in a fenced ```gleam code block.
- A short closing note on which 1–2 files would be the best *first* port
  (smallest risk, highest signal) if the user wants to start incrementally.

This is a substantial, save-worthy document — create it as a markdown file
via the docx/md file-creation workflow (see the `md` conventions in the main
skill list) rather than dumping the whole thing inline in chat, unless the
user only asked about a small number of files, in which case answering
inline is fine.

## Notes on the scanner's scoring model

- Positive signals (switch-on-tag, functional pipelines, type declarations,
  const-heavy/immutable style, Result/Option-shaped returns) push the score
  up.
- Negative signals (`let` reassignment, class inheritance, DOM/browser
  globals, Node-native I/O, heavy external-package imports, array mutation
  methods, decorators) push it down.
- Hard disqualifiers (JSX render output, React imports, `eval`/`Function`/
  `Proxy`/`Reflect`, prototype hacking) force the tier to `Not a fit`
  regardless of other signals — these are fundamentally poor Gleam fits, not
  just low-scoring ones.
- Score is normalized per ~50 lines of code so a 20-line file and a 400-line
  file are comparable.

If the scanner script needs modification (new signal, different weights),
edit `scripts/src/analyze.ts` (strict TypeScript, zero runtime deps beyond
Node's `fs`/`path`) and recompile with `npx tsc -p tsconfig.json`, then copy
`dist/analyze.js` over `scripts/analyze.js` — the shipped `scripts/analyze.js`
is the one actually executed and must stay in sync with the source.
