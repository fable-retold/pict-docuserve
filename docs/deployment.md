# Deployment

Docuserve provides two CLI commands for working with documentation folders.

## Serving Locally

The `serve` command starts an HTTP server that overlays your markdown folder with the Docuserve application assets. No files are copied into your docs folder -- the SPA assets are served transparently from the module's `dist/` directory.

```bash
npx pict-docuserve serve ./docs
```

This starts a server on `http://127.0.0.1:3333`. Your markdown files (`_cover.md`, `_sidebar.md`, `_topbar.md`, and all `*.md` pages) are served from the docs folder, while `index.html`, the CSS, and the JavaScript bundles come from the module.

### Custom port

```bash
npx pict-docuserve serve ./docs --port 8080
```

### How the overlay works

For each HTTP request, the server checks the docs folder first. If the file is not found there, it falls back to the module's built `dist/` folder. This means:

- `/_cover.md` -- served from your docs folder
- `/index.html` -- served from `dist/` (the Docuserve SPA entry point)
- `/js/pict.min.js` -- served from `dist/js/`
- `/pict-docuserve.min.js` -- served from `dist/`

If your docs folder contains its own `index.html`, it takes precedence.

## Injecting for Static Hosting

The `inject` command copies the Docuserve application assets into a target folder, making it self-contained and ready to deploy to any static host.

```bash
npx pict-docuserve inject ./docs
```

After injection, the folder contains your markdown files alongside:

<!-- bespoke diagram: edit diagrams/injecting-for-static-hosting.mmd or .hints.json, then: npx pict-renderer-graph build modules/pict/pict-docuserve/docs -->
![Injecting for Static Hosting](diagrams/injecting-for-static-hosting.svg)

Deploy this folder to GitHub Pages, Netlify, or any HTTP server.

## GitHub Pages Deployment

### Option 1: Inject and push

```bash
# Inject assets into your docs folder
npx pict-docuserve inject ./docs

# Commit and push -- configure GitHub Pages to serve from docs/
git add docs/
git commit -m "Update documentation"
git push
```

### Option 2: GitHub Actions

Create a workflow that builds and deploys on push:

```yaml
name: Deploy Docs
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx pict-docuserve inject ./docs
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## Quackage Integration

If your project uses Quackage, these commands are available:

```bash
# Generate a catalog from module documentation (no inject)
npx quack indoctrinate ./docs/ -d ./modules

# Generate a keyword search index (no inject)
npx quack indoctrinate-index ./docs/ -d ./modules

# Do everything: catalog + keyword index + inject assets
npx quack prepare-docs ./docs/ -d ./modules

# Serve docs locally
npx quack docuserve-serve ./docs/
```

## Example Applications

The `example_applications/` folder contains sample documentation sites. These folders contain only markdown -- no injected assets. Serve any example with:

```bash
npx pict-docuserve serve ./example_applications/todo-app/docs
```

Or use the helper script:

```bash
node example_applications/build-examples.js serve todo-app
```
