# Content Authoring

Docuserve renders standard Markdown files. If you've written docs for docsify, your existing content will work with minimal or no changes.

## Page Files

Any `.md` file placed alongside the built site is accessible via the `#/page/` route. For example, `getting-started.md` is available at `#/page/getting-started`.

The file `README.md` serves as the default home content when no `_cover.md` is present.

## _cover.md

The `_cover.md` file drives the splash screen. Docuserve parses it into structured sections:

```markdown
# Your Project Name

> A short tagline for your project

A longer description paragraph that explains what the project does.

- **Feature One** -- Description of the first feature
- **Feature Two** -- Description of the second feature
- **Feature Three** -- Description of the third feature

[Get Started](getting-started.md)
[API Reference](api.md)
[GitHub](https://github.com/your/repo)
```

### How each element maps

| Markdown Element | Splash Section |
|-----------------|----------------|
| `# Heading` | Large title |
| `> Blockquote` | Tagline (italic, below title) |
| Plain text | Description paragraph |
| `- **Bold** -- text` | Highlight cards (bold = card title) |
| `- Plain bullet` | Highlight card (no title, just text) |
| `[Text](url)` (bare line) | Action buttons (first = primary, rest = secondary) |

External URLs (starting with `http`) open in a new tab. Internal links are converted to hash routes automatically.

### Fallback behavior

If `_cover.md` is not present, the splash screen shows:
- Title: "Retold" (or your project name)
- Cards for each catalog group with their descriptions
- No action buttons

## _sidebar.md

The `_sidebar.md` file controls the sidebar navigation tree. It uses indented Markdown lists:

```markdown
- [Home](/)

- Getting Started

  - [Installation](getting-started.md)
  - [Quick Start](quick-start.md)
  - [Configuration](configuration.md)

- [API Reference](api.md)

  - [Users](/api/users/)
  - [Products](/api/products/)
  - [Orders](/api/orders/)

- [Guides](guides.md)

  - [Authentication](guides/auth.md)
  - [Deployment](guides/deploy.md)
```

### Structure rules

- **Top-level items** (no indent) become group headers in the sidebar
- **Indented items** (2+ spaces) become modules/pages within that group
- Items with `[links](url)` are clickable; plain text items are section headers
- The `/` path maps to the Home/splash screen
- Paths like `/group/module/` map to `#/doc/group/module` routes
- Paths like `something.md` map to `#/page/something` routes

### Fallback behavior

If `_sidebar.md` is not present, the sidebar is built from `retold-catalog.json`, showing each module group and its modules.

## Markdown Support

Docuserve's built-in parser handles the most common Markdown constructs:

- **Headings** (`# H1` through `###### H6`) with auto-generated IDs
- **Paragraphs** with inline formatting
- **Bold** (`**text**` or `__text__`)
- **Italic** (`*text*` or `_text_`)
- **Inline code** (`` `code` ``)
- **Fenced code blocks** with language annotation (including [Mermaid diagrams](diagrams.md))
- **LaTeX equations** via [KaTeX](latex.md) (inline `$...$` and display `$$...$$`)
- **Links** (`[text](url)`) with automatic internal link conversion
- **Images** (`![alt](src)`)
- **Unordered lists** (`-`, `*`, or `+`)
- **Ordered lists** (`1.`, `2.`, etc.)
- **Blockquotes** (`> text`)
- **Horizontal rules** (`---`, `***`, or `___`)
- **Tables** (GitHub-flavored pipe syntax)

### Internal links

Links to other documentation pages are automatically converted to hash routes:

| Markdown Link | Resolved Route |
|---------------|---------------|
| `[text](https://fable-retold.github.io/fable/)` | `#/doc/fable/fable` |
| `[text](architecture.md)` | `#/page/architecture` |
| `[text](/meadow/foxhound/query-dsl.md)` | `#/doc/meadow/foxhound/query-dsl.md` |
| `[text](https://example.com)` | Opens externally |

### Limitations

The built-in parser does not currently support:

- Nested lists (only one level deep)
- Footnotes
- Task lists / checkboxes
- HTML pass-through
