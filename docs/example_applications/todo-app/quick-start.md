> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Quick Start

Get Taskflow running in under five minutes.

## Prerequisites

- Node.js 18 or later
- npm 9 or later

## Installation

```bash
npm install taskflow
```

## Create Your First App

```javascript
const libFable = require('fable');
const libTaskflow = require('taskflow');

let _Fable = new libFable({
    Product: 'MyTasks',
    LogLevel: 3
});

let _App = _Fable.instantiateServiceProvider('Taskflow', {
    Database: { Type: 'sqlite', Path: './tasks.db' },
    Server: { Port: 8080 }
});

_App.start((pError) =>
{
    if (pError)
    {
        _Fable.log.error('Failed to start: ' + pError);
        return;
    }
    _Fable.log.info('Taskflow is running at http://localhost:8080');
});
```

## Using the API

Once running, you can create tasks via the REST API:

```bash
# Create a new task
curl -X POST http://localhost:8080/api/Task \
  -H "Content-Type: application/json" \
  -d '{"Title": "Buy groceries", "Priority": 2, "ListIDTask": 1}'

# List all tasks
curl http://localhost:8080/api/Tasks

# Complete a task
curl -X PUT http://localhost:8080/api/Task/1 \
  -H "Content-Type: application/json" \
  -d '{"Completed": true}'
```

## Default Lists

Taskflow creates three default lists on first run:

| ID | Name | Description |
|----|------|-------------|
| 1 | Inbox | Default list for new tasks |
| 2 | Today | Tasks to focus on today |
| 3 | Someday | Tasks for later |

## Next Steps

- [Tasks](tasks.md) -- Learn about task properties and lifecycle
- [Lists](lists.md) -- Organizing tasks into lists
- [API Reference](api.md) -- Complete API documentation
- [Configuration](configuration.md) -- Customize Taskflow behavior
