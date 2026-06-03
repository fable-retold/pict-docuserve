# Architecture

Docuserve follows the standard Pict application pattern: a main application class registers views and providers, which collaborate through `AppData` and the Pict service layer.

## Application Lifecycle

1. **HTML loads** `pict.min.js` and `pict-docuserve.min.js`
2. **Bootstrap** via `Pict.safeOnDocumentReady()` instantiates the application
3. **Constructor** registers the router, documentation provider, and all views
4. **`onAfterInitializeAsync`** initializes `AppData.Docuserve` state and triggers the provider to load the catalog, `_cover.md`, and `_sidebar.md` in parallel
5. **Layout renders** the shell (top bar + sidebar + content area)
6. **Splash view** populates from `_cover.md` data (or catalog fallback)
7. **Sidebar view** populates from `_sidebar.md` data (or catalog fallback)
8. **Router resolves** the current hash URL to show the correct content

## Component Overview

### Documentation Provider

`Pict-Provider-Docuserve-Documentation.js` is the data layer. It handles:

- **Catalog loading** -- Fetches `retold-catalog.json` and builds sidebar group data
- **Cover loading** -- Fetches and parses `_cover.md` into structured splash data
- **Sidebar loading** -- Fetches and parses `_sidebar.md` into navigation groups
- **Keyword index loading** -- Fetches `retold-keyword-index.json` and hydrates a lunr search index
- **Document fetching** -- Retrieves markdown from local paths or raw GitHub URLs
- **Markdown parsing** -- Converts markdown to HTML (headings, code blocks, tables, lists, links, etc.)
- **Link conversion** -- Translates docsify-style paths to Docuserve hash routes
- **Search** -- Queries the lunr index and returns ranked results with document metadata

### Views

| View | File | Purpose |
|------|------|---------|
| Layout | `PictView-Docuserve-Layout.js` | Shell with top bar, sidebar, content containers |
| TopBar | `PictView-Docuserve-TopBar.js` | Navigation header with brand, nav links, and search |
| Sidebar | `PictView-Docuserve-Sidebar.js` | Group/module navigation tree with inline search |
| Splash | `PictView-Docuserve-Splash.js` | Landing page with title, highlights, actions |
| Content | `PictView-Docuserve-Content.js` | Markdown content display area |
| Search | `PictView-Docuserve-Search.js` | Dedicated full-page search with results |

### Router

Hash-based routing with these patterns:

| Route | Action |
|-------|--------|
| `#/Home` | Show splash screen |
| `#/search/:query` | Show search page with results |
| `#/doc/:group/:module` | Load module README from GitHub |
| `#/doc/:group/:module/*path` | Load specific doc from module |
| `#/page/:docpath` | Load a local markdown page |

## Data Flow

<!-- bespoke diagram: edit diagrams/data-flow.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Data Flow](diagrams/data-flow.svg)

The catalog always loads first and provides default sidebar data. Then `_cover.md`, `_sidebar.md`, `_topbar.md`, and `retold-keyword-index.json` load in parallel; if they succeed, they override the defaults. Search UI only appears when the keyword index is available.

## File Structure

<!-- bespoke diagram: edit diagrams/file-structure.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![File Structure](diagrams/file-structure.svg)
