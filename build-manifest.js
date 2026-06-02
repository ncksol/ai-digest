#!/usr/bin/env node
// Rebuild manifest.json from the digests/ directory.
//
// The site (index.html) reads `manifest.digests` - an OBJECT with a `digests`
// array of "YYYY-MM-DD.md" filenames, newest first. Writing a bare array (or
// dropping the .md suffix, or leaking the "digests" dir name) silently breaks
// the site render. This script is the single source of truth for that shape.
//
// Usage:
//   node build-manifest.js            # rebuild from directory, write manifest.json
//   node build-manifest.js --check    # verify manifest.json matches directory; exit 1 if not
//
// Exit codes: 0 = OK, 1 = check failed / error.

const fs = require("fs");
const path = require("path");

const SITE_DIR = __dirname;
const DIGESTS_DIR = path.join(SITE_DIR, "digests");
const MANIFEST_PATH = path.join(SITE_DIR, "manifest.json");

const DATE_MD = /^\d{4}-\d{2}-\d{2}\.md$/;

function listDigests() {
  if (!fs.existsSync(DIGESTS_DIR)) {
    console.error("❌ digests/ directory not found:", DIGESTS_DIR);
    process.exit(1);
  }
  return fs
    .readdirSync(DIGESTS_DIR)
    .filter((f) => DATE_MD.test(f))
    .sort()
    .reverse(); // newest first
}

function buildManifestObject(files) {
  return { digests: files };
}

const checkMode = process.argv.includes("--check");
const files = listDigests();

if (files.length === 0) {
  console.error("❌ No valid YYYY-MM-DD.md files found in digests/");
  process.exit(1);
}

const expected = JSON.stringify(buildManifestObject(files), null, 2) + "\n";

if (checkMode) {
  let actual = "";
  try {
    actual = fs.readFileSync(MANIFEST_PATH, "utf8");
  } catch {
    console.error("❌ manifest.json not readable");
    process.exit(1);
  }
  // Parse both to compare structurally, not byte-for-byte.
  let parsed;
  try {
    parsed = JSON.parse(actual);
  } catch {
    console.error("❌ manifest.json is not valid JSON");
    process.exit(1);
  }
  if (!parsed || !Array.isArray(parsed.digests)) {
    console.error('❌ manifest.json wrong shape: expected { "digests": [...] }, got:', Array.isArray(parsed) ? "bare array" : typeof parsed);
    process.exit(1);
  }
  const bad = parsed.digests.filter((f) => !DATE_MD.test(f));
  if (bad.length) {
    console.error("❌ manifest.digests contains non-digest entries:", bad.join(", "));
    process.exit(1);
  }
  if (parsed.digests.length !== files.length) {
    console.error(`❌ manifest has ${parsed.digests.length} entries, directory has ${files.length}`);
    process.exit(1);
  }
  console.log(`✅ manifest.json OK: object shape, ${parsed.digests.length} entries, all valid`);
  process.exit(0);
}

fs.writeFileSync(MANIFEST_PATH, expected);
console.log(`✅ Wrote manifest.json: ${files.length} entries, newest = ${files[0]}`);
