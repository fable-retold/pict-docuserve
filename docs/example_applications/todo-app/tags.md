> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Tags & Filters

Tags provide a flexible way to categorize tasks across lists. Unlike lists (which are exclusive -- a task belongs to one list), tags are additive -- a task can have any number of tags.

## Adding Tags

```bash
# Tag a task via API
curl -X POST http://localhost:8080/api/TaskTag \
  -H "Content-Type: application/json" \
  -d '{"IDTask": 42, "Tag": "grocery"}'
```

## Filtering by Tag

```bash
# Get all tasks with a specific tag
curl http://localhost:8080/api/Tasks?Tag=grocery

# Get all tasks with multiple tags (AND)
curl http://localhost:8080/api/Tasks?Tag=grocery&Tag=urgent

# Get all unique tags in use
curl http://localhost:8080/api/Tags
```

## Tag Conventions

Taskflow doesn't enforce tag naming, but we recommend:

- Use lowercase: `work` not `Work`
- Use hyphens for multi-word tags: `follow-up` not `follow up`
- Keep tags short and descriptive
- Use consistent prefixes for related tags: `project-alpha`, `project-beta`

## Filter Expressions

The API supports filter expressions for complex queries:

```bash
# Tasks with priority >= 2 and a due date
curl "http://localhost:8080/api/Tasks?Filter=Priority>=2,DueDate!=null"

# Tasks created this week
curl "http://localhost:8080/api/Tasks?Filter=CreateDate>=2026-02-03"

# Combine tag and property filters
curl "http://localhost:8080/api/Tasks?Tag=work&Filter=Priority>=2"
```
