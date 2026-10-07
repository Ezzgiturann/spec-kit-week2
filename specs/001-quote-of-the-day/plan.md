# Implementation Plan: Quote of the Day

**Branch**: `001-quote-of-the-day` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-quote-of-the-day/spec.md`

## Summary

A single static page shows one random quote from a built-in collection, offers a "New quote"
button that never repeats the current quote, lets the visitor favorite/unfavorite the current
quote, and lists all favorites (newest first) below it with a per-entry unfavorite control.
Favorites persist in the browser's `localStorage`; if storage is unavailable the page falls back
to in-memory favorites and tells the visitor.

Technical approach (per user input): plain HTML, CSS, and JavaScript (native ES modules), no
backend, no build step, no runtime dependencies. Logic is split into small pure modules
(random selection, favorites state, storage adapter) with injected randomness and storage so they
can be unit-tested in Node; a thin view module wires them to the DOM and is covered by
integration tests in a simulated DOM. See [research.md](./research.md).

## Technical Context

**Language/Version**: JavaScript (ES2022, native ES modules), HTML5, CSS3

**Primary Dependencies**: None at runtime. Dev-only: ESLint (lint), Prettier (format),
jsdom (DOM for integration tests). Justified in research.md R-6.

**Storage**: Browser `localStorage`, key `qotd.favorites.v1`, versioned JSON
(see [contracts/storage.md](./contracts/storage.md)); in-memory fallback when unavailable.

**Testing**: Node.js built-in test runner (`node --test`, Node ≥ 22) with built-in coverage
(`--experimental-test-coverage`, line threshold 80%); jsdom for integration tests;
manual browser checks per [quickstart.md](./quickstart.md).

**Target Platform**: Current evergreen desktop and mobile browsers (Chrome, Firefox, Safari,
Edge — last 2 versions), served over HTTP as static files.

**Project Type**: Static single-page web app (frontend only).

**Performance Goals**: Quote visible < 1 s after load (SC-001); "New quote" and favorite toggles
update the page < 200 ms (SC-002) — trivially met as all work is synchronous and in-memory.

**Constraints**: No backend, no network calls, no build step, no runtime dependencies; works at
360 px width without horizontal scroll (FR-012); keyboard and screen-reader accessible (FR-011,
FR-017); never inject quote text as HTML.

**Scale/Scope**: 20–50 built-in quotes; favorites list ≤ collection size; one page, ~6 source
modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Checked against constitution v1.0.0.

| Principle / Gate | How this plan complies | Status |
|---|---|---|
| I. Readable, Intentional Code | Small single-purpose modules with intention-revealing names; ESLint + Prettier configured, zero warnings required. | ✅ Pass |
| II. Test-First (NON-NEGOTIABLE) | tasks.md will order a failing test before each implementation task; tests derive from spec acceptance scenarios. | ✅ Pass (enforced in tasks) |
| III. Meaningful Test Coverage | Unit tests for every module's public API incl. boundaries/errors; integration tests for the DOM ⇄ store ⇄ storage boundary; injected RNG/storage keep tests deterministic; ≥ 80% line coverage gate via Node's built-in coverage. | ✅ Pass |
| IV. Simplicity & Single Responsibility | No framework, no bundler, no runtime deps; dev-only deps justified in research.md R-6; one responsibility per module. | ✅ Pass |
| V. Maintainability by Default | Storage and randomness injected at boundaries; storage failures handled explicitly with user notice; module APIs documented in contracts/modules.md; storage schema versioned. | ✅ Pass |
| Quality gates (workflow §3) | `npm test`, `npm run lint`, `npm run format:check` scripts; coverage threshold enforced by test command. | ✅ Pass |

No violations → Complexity Tracking left empty.

**Post-design re-check (after Phase 1)**: ✅ Still passing. The design adds no modules or
dependencies beyond those listed above; contracts document every public interface (Principle V);
the storage contract's validation rules give concrete unit-test cases (Principle III).

## Project Structure

### Documentation (this feature)

```text
specs/001-quote-of-the-day/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── ui.md            # DOM structure, labels, ARIA, behaviors
│   ├── storage.md       # localStorage key + JSON schema + validation
│   └── modules.md       # Public API of each JS module
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
index.html               # Page markup; loads src/main.js as a module
src/
├── styles.css           # Layout, responsive rules, focus styles
├── main.js              # Composition root: builds deps, mounts the app
├── quotes.js            # Built-in quote collection (data only)
├── random.js            # pickRandom / pickDifferent (pure, RNG injected)
├── storage.js           # Safe storage adapter (localStorage or in-memory fallback)
├── favorites.js         # Favorites state: parse/validate, toggle, remove, list, persist
└── view.js              # DOM rendering + event wiring (no business logic)

tests/
├── unit/
│   ├── quotes.test.js       # collection integrity (unique ids, non-empty text)
│   ├── random.test.js
│   ├── storage.test.js
│   └── favorites.test.js
└── integration/
    └── app.test.js          # jsdom: full page flows from spec acceptance scenarios

package.json             # scripts: test, lint, format, format:check, serve
eslint.config.js
.prettierrc.json
.gitignore               # node_modules, coverage
```

**Structure Decision**: Single static frontend project at the repository root. `src/` holds
browser code loaded directly by `index.html` (no build), `tests/` mirrors it with unit and
integration folders. No backend directory, per user input.

## Complexity Tracking

No constitution violations; nothing to justify.
