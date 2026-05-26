> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Tasks

Tasks are the core entity in Taskflow. Each task represents a unit of work with metadata for organization and tracking.

## Task Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `IDTask` | integer | Auto | Unique identifier |
| `Title` | string | Yes | Short description of the work |
| `Description` | string | No | Detailed notes or context |
| `Priority` | integer | No | 0=Low, 1=Medium, 2=High, 3=Critical |
| `DueDate` | datetime | No | When the task should be completed |
| `Completed` | boolean | No | Whether the task is done |
| `CompletedDate` | datetime | Auto | When the task was marked complete |
| `ListIDTask` | integer | No | Which list the task belongs to |
| `CreateDate` | datetime | Auto | When the task was created |
| `UpdateDate` | datetime | Auto | When the task was last modified |

## Task Lifecycle

A task progresses through these states:

1. **Created** -- Task exists with `Completed = false`
2. **In Progress** -- No explicit state; indicated by being assigned to a "Today" list
3. **Completed** -- `Completed = true`, `CompletedDate` is set automatically
4. **Deleted** -- Soft delete via the `Deleted` flag

## Priority Levels

Priorities determine sort order and visual treatment:

- **0 - Low** -- Can be deferred; no urgency
- **1 - Medium** -- Normal priority; should be done in due course
- **2 - High** -- Important; should be addressed soon
- **3 - Critical** -- Urgent; needs immediate attention

## Working with Tags

Tasks can have multiple tags attached. Tags are simple strings stored in a join table:

```javascript
// Add a tag to a task
_App.services.TaskTag.create({
    IDTask: 42,
    Tag: 'grocery'
});

// Find tasks by tag
_App.services.Task.readsByTag('grocery', (pError, pTasks) =>
{
    console.log('Grocery tasks:', pTasks);
});
```

## Due Date Behavior

When a task has a `DueDate` set:

- The UI highlights overdue tasks in red
- The API includes an `Overdue` computed field in responses
- Tasks are sorted with overdue items first within their priority group
