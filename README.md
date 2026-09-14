# Plain Style

A small static library for reading Puritan works in their original English
alongside a modernized text, with a toggle between a lighter (formal
equivalence) and heavier (dynamic equivalence) degree of modernization.
Modeled loosely on [aquinas.cc](https://aquinas.cc/)'s side-by-side approach.

No build step, no server, no dependencies beyond one Google Fonts import.
Everything is plain HTML/CSS/JS.

## Files

```
index.html        the library homepage — lists all works
reader.html        the reader — loads a work by ?work= slug in the URL
css/style.css       all styling
js/data.js          the content: every work, section, and translation
js/library.js        renders the homepage list from data.js
js/reader.js         renders a reader page from data.js
```

## Running it locally

Any static file server works. From this folder:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

(Opening `index.html` directly by double-clicking will mostly work too, but
some browsers restrict local `fetch`/script behavior for `file://` URLs —
a local server is more reliable.)

## Deploying

**GitHub Pages**
1. Push this folder to a GitHub repo.
2. In the repo settings, under Pages, set the source to the branch/root
   you pushed to.
3. Your site will be live at `https://<you>.github.io/<repo>/`.

**Netlify**
1. Drag this folder onto [app.netlify.com/drop](https://app.netlify.com/drop),
   or connect the repo for continuous deploys.
2. No build command needed — the publish directory is the project root.

Either way, `reader.html?work=directory-for-family-worship` is a stable,
shareable link straight to that work. Add `&level=heavy` (or `light`) to
link to a specific modernization level, and `#sec-4` (etc.) to link to a
specific section.

## Adding a new work

Open `js/data.js`. Copy the `directory-for-family-worship` object inside
`WORKS`, give it a new key (this becomes the URL slug), and fill in:

- `title`, `subtitle`, `author`, `date`, `sourceNote`, `sourceUrl`
- `sections`: an array of sections, each with an `id`, a `number` (roman
  numeral, or `""` if the section has none), a `title`, and `paragraphs` —
  an array of `{ original, light, heavy }` strings.

The homepage and reader both render entirely from this file, so a new
entry in `WORKS` appears on the homepage automatically — nothing else
needs to change.

## About the modernization drafts

The `light` and `heavy` text for *The Directory for Family Worship* are
first-pass drafts, meant to be reviewed and edited by hand — not a
finished translation. `light` stays close to the original's sentence
structure and word order, updating spelling and archaic vocabulary.
`heavy` rewrites more freely into plain contemporary sentences. Edit
either directly in `js/data.js`; there's no separate build step to run
afterward.

The original 1647 text is in the public domain. The modernizations are
original editorial work for this project.

## A note on "A Case of Conscience Resolved"

The epub you provided for this work carries a 2024 copyright notice and a
CC BY-NC-ND license (Aaron Sturgill / Project Puritas / Crowdedship) —
"No Derivatives" and "Non-Commercial." Since this site's whole purpose is
producing derivative (modernized) text, I didn't build from that specific
edition. Instead the original text here comes from the Text Creation
Partnership's (EEBO-TCP) old-spelling transcription of the 1683 printing,
held by the University of Michigan Library, which is explicitly dedicated
to the public domain under CC0 — free to copy, modify, and redistribute,
commercially or not, without permission. A few purely typographic
artifacts from the source printing (the old "VV" rendering of "W" in
capitals) were silently normalized; the wording and spelling are otherwise
unchanged from that transcription.
