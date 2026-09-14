#!/usr/bin/env node
/**
 * Regenerates js/data/manifest.js and js/data/<slug>.js from the plain-text
 * files under /sources/<slug>/.
 *
 * Usage:  node scripts/build.js
 *
 * Each work folder needs:
 *   meta.txt      — title, author, date, etc. (key: value, one per line)
 *   original.md   — the historical text
 *   light.md      — light (formal-equivalence) modernization
 *   heavy.md      — heavy (dynamic-equivalence) modernization
 *
 * In each .md file, sections are marked with:
 *   %% section: some-id
 *   %% number: I          (roman numeral, or leave blank)
 *   %% title: Section Title
 *
 *   First paragraph of the section.
 *
 *   Second paragraph.
 *
 * A blank line separates paragraphs. The three .md files for a work must
 * have the same sections, in the same order, with the same id on each
 * "%% section:" line, and the same number of paragraphs per section —
 * this script checks that and stops with an error (naming the exact
 * section/paragraph) if something doesn't line up, rather than silently
 * generating a mismatched page.
 *
 * Output: js/data/manifest.js holds lightweight metadata for every work
 * (what the homepage needs); js/data/<slug>.js holds one work's full text
 * (loaded only when that work is actually being read). This keeps reading
 * one short work from downloading the whole library.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCES_DIR = path.join(ROOT, 'sources');
const OUTPUT_FILE = path.join(ROOT, 'js', 'data.js'); // old single-file output — removed if present
const LEVELS = ['original', 'light', 'heavy'];
const REQUIRED_META = ['slug', 'title', 'author', 'date', 'sourceNote', 'sourceUrl'];

function fail(message) {
  console.error('Build failed: ' + message);
  process.exit(1);
}

function parseMeta(text, label) {
  const meta = {};
  text.split('\n').forEach(function (line) {
    const m = line.match(/^([a-zA-Z]+):\s?(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
  });
  REQUIRED_META.forEach(function (key) {
    if (!meta[key]) fail(label + ' is missing "' + key + '"');
  });
  return meta;
}

// Parses one .md file into an ordered list of
// { id, number, title, paragraphs: [string, ...] }
function parseSections(text, label) {
  const lines = text.split('\n');
  const sections = [];
  let current = null;
  let buffer = [];

  function flushParagraph() {
    const para = buffer.join(' ').replace(/[ \t]+/g, ' ').trim();
    if (para) current.paragraphs.push(para);
    buffer = [];
  }

  lines.forEach(function (line) {
    const sectionMatch = line.match(/^%%\s*section:\s*(.*)$/);
    const numberMatch = line.match(/^%%\s*number:\s*(.*)$/);
    const titleMatch = line.match(/^%%\s*title:\s*(.*)$/);

    if (sectionMatch) {
      if (current) { flushParagraph(); sections.push(current); }
      current = { id: sectionMatch[1].trim(), number: '', title: '', paragraphs: [] };
      buffer = [];
      return;
    }
    if (!current) {
      if (line.trim() === '') return;
      fail(label + ': found text before the first "%% section:" marker: "' + line + '"');
    }
    if (numberMatch) { current.number = numberMatch[1].trim(); return; }
    if (titleMatch) { current.title = titleMatch[1].trim(); return; }

    if (line.trim() === '') {
      flushParagraph();
      return;
    }
    buffer.push(line.trim());
  });
  if (current) { flushParagraph(); sections.push(current); }

  if (sections.length === 0) fail(label + ': no sections found (no "%% section:" markers)');
  sections.forEach(function (s) {
    if (s.paragraphs.length === 0) fail(label + ': section "' + s.id + '" has no paragraph text');
  });
  return sections;
}

function loadWork(dirName) {
  const dir = path.join(SOURCES_DIR, dirName);
  const metaPath = path.join(dir, 'meta.txt');
  if (!fs.existsSync(metaPath)) fail('sources/' + dirName + '/meta.txt is missing');
  const meta = parseMeta(fs.readFileSync(metaPath, 'utf8'), 'sources/' + dirName + '/meta.txt');

  const parsed = {};
  LEVELS.forEach(function (level) {
    const file = path.join(dir, level + '.md');
    if (!fs.existsSync(file)) fail('sources/' + dirName + '/' + level + '.md is missing');
    parsed[level] = parseSections(fs.readFileSync(file, 'utf8'), 'sources/' + dirName + '/' + level + '.md');
  });

  const [orig, light, heavy] = LEVELS.map(function (l) { return parsed[l]; });

  if (orig.length !== light.length || orig.length !== heavy.length) {
    fail(
      'sources/' + dirName + ': section count mismatch — original.md has ' + orig.length +
      ' section(s), light.md has ' + light.length + ', heavy.md has ' + heavy.length +
      '. Add or remove a "%% section:" block so all three match.'
    );
  }

  const sections = orig.map(function (origSection, i) {
    const lightSection = light[i];
    const heavySection = heavy[i];

    if (origSection.id !== lightSection.id || origSection.id !== heavySection.id) {
      fail(
        'sources/' + dirName + ': section #' + (i + 1) + ' id mismatch — ' +
        'original.md has "' + origSection.id + '", light.md has "' + lightSection.id +
        '", heavy.md has "' + heavySection.id + '". Sections must appear in the same order ' +
        'with the same id in all three files.'
      );
    }
    if (
      origSection.paragraphs.length !== lightSection.paragraphs.length ||
      origSection.paragraphs.length !== heavySection.paragraphs.length
    ) {
      fail(
        'sources/' + dirName + ': section "' + origSection.id + '" has a different number of ' +
        'paragraphs in each file — original.md: ' + origSection.paragraphs.length +
        ', light.md: ' + lightSection.paragraphs.length + ', heavy.md: ' + heavySection.paragraphs.length +
        '. Check for a missing blank line between paragraphs.'
      );
    }

    return {
      id: origSection.id,
      number: origSection.number,
      title: origSection.title,
      paragraphs: origSection.paragraphs.map(function (origPara, j) {
        return { original: origPara, light: lightSection.paragraphs[j], heavy: heavySection.paragraphs[j] };
      })
    };
  });

  const work = {
    slug: meta.slug,
    title: meta.title,
    subtitle: meta.subtitle || '',
    author: meta.author,
    date: meta.date,
    sourceNote: meta.sourceNote,
    sourceUrl: meta.sourceUrl,
    sections: sections
  };
  if (meta.signature) work.signature = meta.signature;

  if (dirName !== meta.slug) {
    console.warn(
      'Warning: sources/' + dirName + '/meta.txt has slug "' + meta.slug +
      '", which doesn\'t match its folder name. The URL will use "' + meta.slug + '".'
    );
  }

  return work;
}

function writeGenerated(dataDir, filename, varName, value, extraComment) {
  const header =
    '/**\n' +
    ' * AUTO-GENERATED by scripts/build.js — do not edit this file by hand.\n' +
    (extraComment ? ' * ' + extraComment + '\n' : '') +
    ' * Edit the source files under /sources/<slug>/ instead, then run:\n' +
    ' *   node scripts/build.js\n' +
    ' */\n\n';
  const body = 'const ' + varName + ' = ' + JSON.stringify(value, null, 2) + ';\n';
  fs.writeFileSync(path.join(dataDir, filename), header + body);
}

function main() {
  if (!fs.existsSync(SOURCES_DIR)) fail('no sources/ directory found at ' + SOURCES_DIR);

  const dirs = fs.readdirSync(SOURCES_DIR)
    .filter(function (name) { return fs.statSync(path.join(SOURCES_DIR, name)).isDirectory(); })
    .sort();

  if (dirs.length === 0) fail('no work folders found under sources/');

  const works = {};
  dirs.forEach(function (dirName) {
    const work = loadWork(dirName);
    if (works[work.slug]) fail('duplicate slug "' + work.slug + '" (check meta.txt in sources/' + dirName + ')');
    works[work.slug] = work;
  });

  const dataDir = path.join(ROOT, 'js', 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  // Small manifest (metadata only, no section text) — this is what the
  // homepage loads, so it never has to download every work's full text
  // just to list them.
  const manifest = {};
  Object.keys(works).forEach(function (slug) {
    const w = works[slug];
    manifest[slug] = {
      slug: w.slug,
      title: w.title,
      subtitle: w.subtitle,
      author: w.author,
      date: w.date
    };
  });
  writeGenerated(dataDir, 'manifest.js', 'MANIFEST', manifest,
    'Metadata only, for the homepage list. Full text is in per-work files below.');

  // One file per work, loaded on demand by reader.html for the specific
  // ?work= slug being read — so reading one sermon never downloads the
  // rest of the library.
  Object.keys(works).forEach(function (slug) {
    writeGenerated(dataDir, slug + '.js', 'WORK_DATA', works[slug]);
  });

  // Remove any leftover per-work files for slugs that no longer exist
  // (e.g. after renaming or deleting a sources/ folder).
  const keepFiles = new Set(Object.keys(works).map(function (s) { return s + '.js'; }));
  keepFiles.add('manifest.js');
  fs.readdirSync(dataDir).forEach(function (file) {
    if (file.endsWith('.js') && !keepFiles.has(file)) {
      fs.unlinkSync(path.join(dataDir, file));
      console.log('Removed stale js/data/' + file);
    }
  });

  // The old single-file data.js is superseded by js/data/ — remove it so
  // nothing accidentally keeps reading stale content from it.
  if (fs.existsSync(OUTPUT_FILE)) fs.unlinkSync(OUTPUT_FILE);

  console.log(
    'Wrote js/data/manifest.js and ' + dirs.length + ' work file(s): ' +
    Object.keys(works).join(', ')
  );
}

main();
