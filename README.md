# Plain Style

A small static library for reading Puritan works in their original English
alongside a modernized text, with a toggle between a lighter (formal
equivalence) and heavier (dynamic equivalence) degree of modernization.
Modeled loosely on [aquinas.cc](https://aquinas.cc/)'s side-by-side approach.

No framework, no npm install, no dependencies beyond one Google Fonts
import in the browser. The site itself is plain HTML/CSS/JS; the one
build step (`node scripts/build.js`) uses only Node's built-in `fs`/`path`
modules — nothing to install.

## Files

```
index.html               library homepage — lists all works
reader.html               the reader — loads a work by ?work= slug in the URL
css/style.css              all styling
js/data/manifest.js         GENERATED — small metadata list, powers the homepage
js/data/<slug>.js           GENERATED — one file per work's full text, do not edit
js/library.js               renders the homepage list from manifest.js
js/reader.js                 renders a reader page; loads js/data/<slug>.js on demand
js/theme.js                 light/dark mode toggle

sources/<slug>/             the actual editable content, one folder per work
  meta.txt                    title, author, date, source links, etc.
  original.md                  the historical text
  light.md                     light (formal-equivalence) modernization
  heavy.md                     heavy (dynamic-equivalence) modernization

scripts/build.js            reads sources/, regenerates js/data/*
```

Reading one work only ever downloads that work's file, not the rest of
the library — `index.html` loads just the small manifest, and
`reader.html` loads the manifest's-worth of nothing extra plus the one
`js/data/<slug>.js` file for whatever `?work=` is in the URL.

## Editing content

**Edit the files under `sources/<slug>/`, never anything under `js/data/`
directly** — that whole folder is generated and gets overwritten every
time you run the build.

Each `.md` file is plain text. Sections are marked like this:

```
%% section: sec-4
%% number: IV
%% title: Who Should Lead

First paragraph of the section.

Second paragraph, separated by a blank line.
```

`original.md`, `light.md`, and `heavy.md` for a work need the same
sections, in the same order, with the same `%% section:` id, and the same
number of paragraphs in each — that's how the build knows which original
paragraph lines up with which translation. Get one of those out of sync
(a missing blank line, a section added to only one file) and the build
stops with an error naming the exact file and section, rather than
silently generating a mismatched page.

After editing, regenerate the site:

```
node scripts/build.js
```

That rewrites everything under `js/data/` from scratch (and removes any
per-work file left over from a deleted or renamed `sources/` folder).
Then just refresh the page — no other step needed.

## Adding a new work

1. Make a new folder under `sources/`, named whatever you want the slug
   (and URL) to be — e.g. `sources/pilgrims-progress/`.
2. Add `meta.txt` with these keys, one per line:
   ```
   slug: pilgrims-progress
   title: The Pilgrim's Progress
   subtitle: From this world to that which is to come
   author: John Bunyan
   date: 1678
   sourceNote: A short description of where the text came from
   sourceUrl: https://example.com/source
   signature: (optional — a closing signature line, if the work has one)
   ```
3. Add `original.md`, `light.md`, and `heavy.md`, following the `%%
   section:` format above.
4. Run `node scripts/build.js`.

The homepage and reader both render from the generated files under
`js/data/`, so once it's rebuilt the new work shows up on the homepage
automatically — nothing else to change.

## Running it locally

Any static file server works. From this folder:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

(Opening `index.html` directly by double-clicking will mostly work too,
but some browsers restrict local `fetch`/script behavior for `file://`
URLs — a local server is more reliable.)

## Deploying

**GitHub Pages**
1. Push this folder to a GitHub repo.
2. In the repo settings, under Pages, set the source to the branch/root
   you pushed to.
3. Your site will be live at `https://<you>.github.io/<repo>/`.

**Netlify**
1. Drag this folder onto [app.netlify.com/drop](https://app.netlify.com/drop),
   or connect the repo for continuous deploys.
2. No build command needed for the deploy itself — just remember to run
   `node scripts/build.js` locally and commit the resulting `js/data/`
   files before you push, since Netlify only serves static files here.

Either way, `reader.html?work=directory-for-family-worship` is a stable,
shareable link straight to that work. Add `&level=heavy` (or `light`) to
link to a specific modernization level, and `#sec-4` (etc.) to link to a
specific section.

## About the modernization drafts

The `light` and `heavy` text throughout are first-pass drafts, meant to
be reviewed and edited by hand — not finished translations. `light`
stays close to the original's sentence structure and word order,
updating spelling and archaic vocabulary. `heavy` rewrites more freely
into plain contemporary sentences.

Both original works here (1647 and 1683) are in the public domain. The
modernizations are original editorial work for this project.

## A note on "A Case of Conscience Resolved"

The epub originally provided for this work carries a 2024 copyright
notice and a CC BY-NC-ND license (Aaron Sturgill / Project Puritas /
Crowdedship) — "No Derivatives" and "Non-Commercial." Since this site's
whole purpose is producing derivative (modernized) text, that specific
edition wasn't used as the source. Instead `sources/a-case-of-conscience-
resolved/original.md` comes from the Text Creation Partnership's
(EEBO-TCP) old-spelling transcription of the 1683 printing, held by the
University of Michigan Library, which is explicitly dedicated to the
public domain under CC0 — free to copy, modify, and redistribute,
commercially or not, without permission. A few purely typographic
artifacts from the source printing (the old "VV" rendering of "W" in
capitals) were silently normalized; the wording and spelling are
otherwise unchanged from that transcription.
