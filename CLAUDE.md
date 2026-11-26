# beirutmediapro-site — Project Conventions

This file is read automatically by Claude Code when you run `claude` inside this
repo's folder. It captures the conventions this project has used so far so any
session (Cowork or Claude Code) can pick up the news-update workflow without
re-deriving it from scratch.

## What this repo is

- Static one-page news site for **beirutmediapro.com** (Baker Habhab's Beirut
  Media Pro).
- Single file: `index.html` on the `main` branch.
- **Cloudflare Pages** auto-deploys straight from `main` — a commit to
  `index.html` on `main` goes live within a minute or two, no build step.
- No other source files; everything (CSS, JS, content) is inlined in that one
  HTML file.

## How to edit this repo

**If you are Claude Code running locally on Baker's machine with his own git
credentials: just use git normally.** Clone it, edit `index.html` with your
normal file tools, `git add`, `git commit`, `git push`. There is no special
trick needed here.

(Background, for context only — not something you need to replicate: an
earlier Cowork cloud-sandbox session could not reach GitHub's git protocol at
all because of its outbound proxy, so it had to drive GitHub's own web file
editor through browser automation, reading/writing the CodeMirror editor's
JS state directly. That workaround is irrelevant once you have real git
access — don't reintroduce it.)

Commit message convention: `Update news: <Month Day, Year> headlines`
(e.g. `Update news: Nov 26, 2026 headlines`).

## Site structure (what to edit for a news refresh)

`index.html` has, in this order:
- `<!-- LAST_AUTO_UPDATE: <ISO-8601 UTC> -->` — an HTML comment right after
  `<!DOCTYPE html>`. Used to compute staleness from the live file alone, no
  external DB. Update this on every refresh.
- `<div class="update-bar" data-en="..." data-ar="...">...</div>` — the
  "last updated" bar. **By convention, `data-en`, `data-ar`, and the visible
  text all carry the SAME Arabic-formatted date string** (e.g. "الأربعاء، ١٨
  تشرين الثاني ٢٠٢٦"). This is intentional, not a bug — don't "fix" it into
  an English translation.
- `<div class="ticker-track">...</div>` — a scrolling headline ticker. Holds
  **5 unique headlines, each duplicated once** (10 `<span>`s total), one each
  representing: the Lebanon lead story, the World side-item, the top Politics
  story, the top Sports story, and the weather.
- `<section id="lebanon">` — the lead story + 3 side-items (World / Politics /
  Tech teasers). See markup below.
- `<section id="politics">`, `<section id="tech">`, `<section id="sports">` —
  each has exactly **3 cards**.
- `<section id="weather">` — a single weather card, no photo, no timestamp.

## Content rules — read before writing any news content

1. **Never fabricate stories.** Every headline must come from a real,
   currently-dated article on a real outlet (naharnet.com, aljazeera.com,
   techcrunch.com, skysports.com for sports, windbornesystems.com/weather for
   Beirut weather, or similar). Verify the article's own date is actually
   recent — sources sometimes serve stale or wrong-location content; double
   check before using it.
2. **Never fabricate or re-host photos.** Only use the *source article's own*
   real `https://` image URL (its `og:image` meta tag, or the main photo at
   the top of the article). Rewrite `http://` to `https://` if needed (mixed
   content is blocked on the HTTPS site). **Never** download/base64-embed an
   image into the HTML — that bloated the file badly once before and had to
   be manually reverted.
3. **Side-items (the 3 teasers inside `#lebanon`'s `.side-list`) never get a
   photo.** There is no image slot in their layout.
4. Content language: headlines/snippets are written in **standard (formal)
   Arabic**, not Lebanese dialect. (Lebanese dialect is only for Claude's own
   conversational replies to Baker, per his preference — it does not apply to
   site content.)
5. Exactly 3 cards per Politics/Tech/Sports section — no more, no less.
6. All of a single update's `<time class="posted">` elements (13 total: 1
   lead + 3 side-items + 3+3+3 cards) share **one shared ISO timestamp** for
   that run, and that same timestamp goes in `LAST_AUTO_UPDATE`.

## Markup patterns (copy these exactly)

**Lead story** (`.lead` inside `#lebanon`):
```html
<div class="lead">
  <div class="lead-frame"><img src="PHOTO_URL" alt="..." style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.remove()"></div>
  <span class="cat" data-en="Lebanon" data-ar="لبنان">Lebanon</span>
  <h3 class="clickable" data-en="TITLE_EN" data-ar="TITLE_AR" data-title-en="TITLE_EN" data-title-ar="TITLE_AR" data-snippet-en="SNIPPET_EN" data-snippet-ar="SNIPPET_AR" data-img="PHOTO_URL" data-link="SOURCE_URL" data-cat-en="Lebanon" data-cat-ar="لبنان" onclick="openArticle(this)">TITLE_EN</h3>
  <p class="dateline" data-en="BEIRUT — " data-ar="بيروت — ">BEIRUT — </p>
  <p data-en="SNIPPET_EN" data-ar="SNIPPET_AR">SNIPPET_EN</p>
  <time class="posted" datetime="SHARED_ISO_TS"></time>
</div>
```

**Side-item** (3x inside `.side-list`, no photo, no `data-link`/`onclick`):
```html
<div class="side-item">
  <span class="meta" data-en="World|Politics|Tech" data-ar="العالم|سياسة|تكنولوجيا">...</span>
  <h4 data-en="TITLE_EN" data-ar="TITLE_AR">TITLE_EN</h4>
  <p class="meta" data-en="SNIPPET_EN" data-ar="SNIPPET_AR">SNIPPET_EN</p>
  <time class="posted" datetime="SHARED_ISO_TS"></time>
</div>
```

**Card** (3x per Politics/Tech/Sports `.story-row`):
```html
<div class="card clickable" data-title-en="TITLE_EN" data-title-ar="TITLE_AR" data-snippet-en="SNIPPET_EN" data-snippet-ar="SNIPPET_AR" data-img="PHOTO_URL" data-link="SOURCE_URL" data-cat-en="SECTION_EN" data-cat-ar="SECTION_AR" onclick="openArticle(this)">
  <div class="frame"><img src="PHOTO_URL" alt="..." style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.remove()"></div>
  <span class="cat" data-en="SECTION_EN" data-ar="SECTION_AR">SECTION_EN</span>
  <h4 data-en="TITLE_EN" data-ar="TITLE_AR">TITLE_EN</h4>
  <p data-en="SNIPPET_EN" data-ar="SNIPPET_AR">SNIPPET_EN</p>
  <time class="posted" datetime="SHARED_ISO_TS"></time>
</div>
```

Note on `data-img` vs the card's own `<img src>`: `data-img` feeds the
article-detail popup modal (`renderArticle()` in the page JS). It does **not**
automatically put a photo on the card/lead thumbnail — that requires
separately putting a real `<img>` tag inside the `.frame`/`.lead-frame` div,
as shown above. If no photo is available for a story, leave
`<div class="frame"></div>` / `<div class="lead-frame"></div>` empty (no
`<img>` inside) rather than using a placeholder graphic.

## Relative timestamps — already built, don't re-implement

**Hidden on the site since Nov 27, 2026 (Baker's request):** CSS sets
`.posted{display:none !important;}`. Keep writing the `<time>` elements
anyway (they still feed `LAST_AUTO_UPDATE` conventions); don't un-hide them
unless asked.

The page already has the CSS (`.posted`, `.posted:empty{display:none;}`) and
JS (`formatRelative(iso, lang)`, `refreshTimestamps()`, wired to a 60s
`setInterval` and re-run inside `setLang()`) to turn
`<time class="posted" datetime="ISO">` into "X hours/minutes ago" text in the
current language. You only ever need to add/update the `<time>` elements
themselves with a fresh `datetime` — never touch the JS/CSS for this, and
never add `data-en`/`data-ar` to a `<time class="posted">` element (that would
make `setLang()` stomp the relative-time text it's supposed to show).

## Existing automation (Cowork side — informational only)

A Cowork scheduled task (not something Claude Code manages) periodically
drives this same refresh via browser automation on Baker's linked desktop.
Its cadence has changed hands a few times (was every 4h, was changed by
another session to "once per day", was disabled after an abandoned run). If
you're editing this repo from Claude Code and notice the site is stale, it's
fine to just do a manual update — there's no conflict, you're both just
writing commits to `main`.
