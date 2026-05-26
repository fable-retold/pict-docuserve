> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Lists

Lists group related tasks together. Every task belongs to exactly one list.

## Default Lists

Taskflow creates these lists automatically on first run:

| List | Purpose |
|------|---------|
| **Inbox** | Landing spot for new tasks without an explicit list |
| **Today** | Tasks you plan to work on today |
| **Someday** | Tasks for the future with no immediate deadline |

## Creating Lists

```javascript
_App.services.List.create({
    Name: 'Work Projects',
    Description: 'Tasks related to ongoing work projects',
    Color: '#3498db'
});
```

## List Properties

| Property | Type | Description |
|----------|------|-------------|
| `IDList` | integer | Unique identifier |
| `Name` | string | Display name |
| `Description` | string | Optional description |
| `Color` | string | Hex color code for UI theming |
| `SortOrder` | integer | Position in the sidebar |
| `Archived` | boolean | Whether the list is hidden from the main view |

## Moving Tasks Between Lists

```bash
# Move task 42 to list 3
curl -X PUT http://localhost:8080/api/Task/42 \
  -H "Content-Type: application/json" \
  -d '{"ListIDTask": 3}'
```

## Smart Lists

Smart lists are virtual lists defined by a filter. They don't store tasks directly; they show tasks matching a query.

```javascript
_App.services.SmartList.create({
    Name: 'Overdue',
    Filter: { Overdue: true },
    Icon: 'warning'
});
```

Built-in smart lists include:

- **All Tasks** -- Every non-deleted task
- **Overdue** -- Tasks past their due date
- **Completed Today** -- Tasks completed in the last 24 hours
- **Untagged** -- Tasks with no tags assigned
