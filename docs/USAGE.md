# Dvine Meet – Usage

This app is a single-page, mobile-first web UI that works entirely offline using IndexedDB (Dexie). Host on GitHub Pages by pushing this repository to a public repo and enabling Pages.

## Quick Start

- Open `index.html` via a local dev server or GitHub Pages
- Use the Dashboard to create a new meet
- Add activities and optional tags
- Begin a live session and pick activities
- Add reflections and adjust durations
- Generate and save a summary
- Export/Import JSON from the top bar

## Offline

A service worker (`sw.js`) caches the app shell and the Dexie ESM from jsDelivr so the app runs offline after the first load.

## Data Model (Dexie)

- `meets`: `{ meetId, title, status, createdAt, seed?, logicState?, liveAt?, endedAt? }`
- `activities`: `{ id, meetId, title, tags? }`
- `picks`: `{ id, meetId, activityId, round, pickedAt, startedAt?, endedAt?, durationMs?, data? }`
- `reflections`: `{ id, meetId, pickId, text, tags?, createdAt }`
- `summaries`: `{ id, meetId, content, meta?, generatedAt }`

Extra fields beyond indexed keys are stored transparently.

## Logic Integration (AI #1)

Replace `logic/logic.js` with your AI logic module that exports the following named functions:

- `makeSeed()` → any value (stored on the meet)
- `pickNext(context)` → `{ activityId, round, data? }`
- `startPick(pick)` → partial pick (e.g., `{ startedAt }`)
- `endPick(pick)` → partial pick (e.g., `{ endedAt, durationMs }`)
- `editDuration(pick, ms)` → partial pick (e.g., `{ durationMs }`)
- `makeSummary({ meet, activities, picks, reflections })` → string or object

The UI calls these functions directly; this project does not re-implement any logic.

## Export / Import

- Export: Downloads a JSON snapshot of all tables
- Import: Merges data by upserting entries from JSON

## Routing

Hash routes:

- `#/dashboard`
- `#/create`
- `#/activities/:meetId`
- `#/live/:meetId`
- `#/timeline/:meetId`
- `#/summary/:meetId`

---

If you replace the logic file and want a cold, offline start, load the site once online so the service worker caches everything.

