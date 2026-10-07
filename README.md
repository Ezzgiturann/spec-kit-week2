# Quote of the Day

A single static page that shows a random quote from a built-in collection, a "New quote" button
that never repeats the current quote, and favorites that persist across reloads (in the browser's
`localStorage`), listed below the current quote. Plain HTML, CSS and JavaScript — no backend, no
build step, no runtime dependencies.

## Run

```bash
npm install      # dev tools only (tests, lint, format)
npm run serve    # http://localhost:8000
```

The page must be served over HTTP: browsers block ES module scripts opened from `file://`.

## Check

```bash
npm test             # unit + integration tests; fails below 80% line coverage
npm run lint         # ESLint, zero warnings allowed
npm run format:check # Prettier
```

## Docs

Spec, plan, contracts and manual validation scenarios:
[`specs/001-quote-of-the-day/`](specs/001-quote-of-the-day/).
