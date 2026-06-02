# Architecture

## System Components

<!-- bespoke diagram: edit diagrams/system-components.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/test/sites/full-featured -->
![System Components](diagrams/system-components.svg)

## Data Flow

1. Browser loads `index.html`
2. Pict framework initializes
3. Provider loads configuration files in parallel
4. Layout view renders the shell
5. Hash change listener dispatches navigation
6. Content is fetched and parsed on demand
