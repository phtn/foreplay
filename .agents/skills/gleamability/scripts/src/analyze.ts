#!/usr/bin/env node
/**
 * analyze.ts — Gleamability scanner
 *
 * Walks a directory of .js/.jsx/.ts/.tsx files and scores each one on how
 * good a candidate it is for porting to Gleam (then compiling back to JS).
 *
 * Pure heuristic / regex-based pass — no AST, no runtime dependencies other
 * than Node's built-in `fs` and `path`. Intended as a fast first pass; a
 * human (or Claude) should sanity-check the top candidates before porting.
 *
 * Usage:
 *   node analyze.js <targetDir> [--top N] [--json out.json] [--ext .ts,.tsx,.js,.jsx]
 */

import * as fs from "fs";
import * as path from "path";

interface SignalHit {
  readonly label: string;
  readonly weight: number;
  readonly count: number;
}

interface FileReport {
  readonly filePath: string;
  readonly loc: number;
  readonly score: number;
  readonly tier: Tier;
  readonly disqualifiers: readonly string[];
  readonly positiveSignals: readonly SignalHit[];
  readonly negativeSignals: readonly SignalHit[];
}

type Tier = "Strong candidate" | "Possible candidate" | "Low priority" | "Not a fit";

interface CliOptions {
  readonly targetDir: string;
  readonly top: number;
  readonly jsonOutPath: string | null;
  readonly extensions: readonly string[];
}

const DEFAULT_EXTENSIONS: readonly string[] = [".ts", ".tsx", ".js", ".jsx"];
const IGNORED_DIR_NAMES: ReadonlySet<string> = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  ".git",
  ".next",
  "assets",
  "coverage",
  "convex",
  ".turbo",
]);

// ---------- CLI parsing ----------

function parseArgs(argv: readonly string[]): CliOptions {
  const positional: string[] = [];
  let top = 10;
  let jsonOutPath: string | null = null;
  let extensions: readonly string[] = DEFAULT_EXTENSIONS;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--top") {
      const value = argv[i + 1];
      top = value ? parseInt(value, 10) : top;
      i += 1;
    } else if (arg === "--json") {
      jsonOutPath = argv[i + 1] ?? null;
      i += 1;
    } else if (arg === "--ext") {
      const value = argv[i + 1];
      extensions = value ? value.split(",").map((e) => (e.startsWith(".") ? e : `.${e}`)) : extensions;
      i += 1;
    } else {
      positional.push(arg);
    }
  }

  const targetDir = positional[0];
  if (!targetDir) {
    process.stderr.write("Usage: node analyze.js <targetDir> [--top N] [--json out.json] [--ext .ts,.tsx]\n");
    process.exit(1);
  }

  return { targetDir, top, jsonOutPath, extensions };
}

// ---------- File discovery ----------

function collectFiles(rootDir: string, extensions: readonly string[]): string[] {
  const results: string[] = [];

  function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIR_NAMES.has(entry.name) && !entry.name.startsWith(".")) {
          walk(path.join(dir, entry.name));
        }
        continue;
      }
      const ext = path.extname(entry.name);
      if (extensions.includes(ext) && !entry.name.endsWith(".d.ts")) {
        results.push(path.join(dir, entry.name));
      }
    }
  }

  const stat = fs.statSync(rootDir);
  if (stat.isDirectory()) {
    walk(rootDir);
  } else {
    results.push(rootDir);
  }

  return results;
}

// ---------- Signal definitions ----------

interface PatternSignal {
  readonly label: string;
  readonly regex: RegExp;
  readonly weight: number;
  readonly cap: number;
}

const POSITIVE_SIGNALS: readonly PatternSignal[] = [
  { label: "switch on tagged field (pattern-match shape)", regex: /switch\s*\(\s*[\w.]+\.(type|tag|kind|status|_tag)\b/g, weight: 4, cap: 20 },
  { label: "discriminated-union-style type alias", regex: /type\s+\w+\s*=\s*(\{[^}]*\}\s*\|\s*)+\{[^}]*\}/g, weight: 4, cap: 12 },
  { label: "functional array pipeline (map/filter/reduce/flatMap)", regex: /\.(map|filter|reduce|flatMap|some|every|find)\(/g, weight: 1, cap: 20 },
  { label: "interface/type declaration", regex: /\b(interface|type)\s+\w+/g, weight: 1, cap: 15 },
  { label: "const declaration (immutability lean)", regex: /\bconst\s+\w/g, weight: 0.3, cap: 30 },
  { label: "pure-looking arrow/function export", regex: /export\s+(const|function)\s+\w+/g, weight: 0.5, cap: 20 },
  { label: "Result/Option-ish return typing", regex: /:\s*(Result|Option|Maybe)<|\{\s*ok:\s*(true|false)/g, weight: 3, cap: 10 },
];

const NEGATIVE_SIGNALS: readonly PatternSignal[] = [
  { label: "let / reassignable binding", regex: /\blet\s+\w/g, weight: 1, cap: 30 },
  { label: "class with inheritance", regex: /class\s+\w+\s+extends\s+\w+/g, weight: 5, cap: 8 },
  { label: "DOM / browser global usage", regex: /\b(document|window|localStorage|sessionStorage|navigator)\./g, weight: 3, cap: 15 },
  { label: "Node-native / fs / process API", regex: /\b(fs|child_process|net|http|process)\.\w/g, weight: 1.5, cap: 15 },
  { label: "external (npm) import", regex: /import\s+.*?from\s+['"](?!\.{1,2}\/)([^'"]+)['"]/g, weight: 1, cap: 15 },
  { label: "mutation via push/splice/sort-in-place/assignment to prop", regex: /\.(push|pop|splice|shift|unshift|sort)\(/g, weight: 1.5, cap: 15 },
  { label: "decorator usage", regex: /^\s*@\w+/gm, weight: 3, cap: 10 },
];

interface DisqualifierRule {
  readonly label: string;
  readonly regex: RegExp;
}

const DISQUALIFIERS: readonly DisqualifierRule[] = [
  { label: "JSX/TSX render output", regex: /return\s*\(?\s*<[a-zA-Z]|<>[\s\S]*<\/>/ },
  { label: "React import (component file)", regex: /from\s+["']react["']|from\s+["']react-dom["']/ },
  { label: "dynamic metaprogramming (eval/Function/Proxy/Reflect)", regex: /\beval\(|new\s+Function\(|new\s+Proxy\(|Reflect\.\w/ },
  { label: "prototype hacking", regex: /__proto__|\.prototype\s*=/ },
];

// ---------- Scoring ----------

function countMatches(source: string, regex: RegExp): number {
  const matches = source.match(regex);
  return matches ? matches.length : 0;
}

function scoreFile(filePath: string, source: string): FileReport {
  const loc = source.split("\n").filter((line) => line.trim().length > 0).length;

  const disqualifiers = DISQUALIFIERS.filter((d) => d.regex.test(source)).map((d) => d.label);

  const positiveSignals: SignalHit[] = POSITIVE_SIGNALS.map((sig) => {
    const raw = countMatches(source, sig.regex);
    const count = Math.min(raw, sig.cap);
    return { label: sig.label, weight: sig.weight, count };
  }).filter((s) => s.count > 0);

  const negativeSignals: SignalHit[] = NEGATIVE_SIGNALS.map((sig) => {
    const raw = countMatches(source, sig.regex);
    const count = Math.min(raw, sig.cap);
    return { label: sig.label, weight: sig.weight, count };
  }).filter((s) => s.count > 0);

  const positiveScore = positiveSignals.reduce((sum, s) => sum + s.weight * s.count, 0);
  const negativeScore = negativeSignals.reduce((sum, s) => sum + s.weight * s.count, 0);

  // Normalize roughly per 50 lines of code so small and large files are comparable.
  const normalizer = Math.max(loc / 50, 0.5);
  const rawScore = 50 + (positiveScore - negativeScore) / normalizer;
  const clamped = Math.max(0, Math.min(100, rawScore));

  let tier: Tier;
  if (disqualifiers.length > 0) {
    tier = "Not a fit";
  } else if (clamped >= 70) {
    tier = "Strong candidate";
  } else if (clamped >= 45) {
    tier = "Possible candidate";
  } else {
    tier = "Low priority";
  }

  return {
    filePath,
    loc,
    score: Math.round(clamped),
    tier,
    disqualifiers,
    positiveSignals,
    negativeSignals,
  };
}

// ---------- Main ----------

function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const files = collectFiles(options.targetDir, options.extensions);

  const reports: FileReport[] = files.map((filePath) => {
    const source = fs.readFileSync(filePath, "utf8");
    return scoreFile(filePath, source);
  });

  const ranked = [...reports].sort((a, b) => b.score - a.score);

  const output = {
    scannedAt: new Date().toISOString(),
    targetDir: options.targetDir,
    fileCount: reports.length,
    results: ranked,
  };

  if (options.jsonOutPath) {
    fs.writeFileSync(options.jsonOutPath, JSON.stringify(output, null, 2), "utf8");
  }

  const top = ranked.slice(0, options.top);
  process.stdout.write(`Scanned ${reports.length} file(s) in ${options.targetDir}\n\n`);
  process.stdout.write(
    "Rank  Score  Tier                LOC   File\n" + "----  -----  ------------------  ----  ----\n"
  );
  top.forEach((r, i) => {
    const rank = String(i + 1).padEnd(4);
    const score = String(r.score).padEnd(5);
    const tier = r.tier.padEnd(18);
    const loc = String(r.loc).padEnd(4);
    process.stdout.write(`${rank}  ${score}  ${tier}  ${loc}  ${r.filePath}\n`);
  });

  if (options.jsonOutPath) {
    process.stdout.write(`\nFull JSON report written to ${options.jsonOutPath}\n`);
  }
}

main();
