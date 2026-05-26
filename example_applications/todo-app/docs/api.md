> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# API Reference

Taskflow provides a RESTful API for all operations. The API follows Meadow endpoint conventions with auto-generated CRUD routes.

## Base URL

```
http://localhost:8080/api
```

## Authentication

By default, Taskflow runs without authentication. Enable API keys in the configuration:

```json
{
  "Auth": {
    "Enabled": true,
    "HeaderName": "X-API-Key"
  }
}
```

## Endpoints

### Tasks

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/Tasks` | List all tasks (paginated) |
| `GET` | `/Task/:id` | Get a single task |
| `POST` | `/Task` | Create a new task |
| `PUT` | `/Task/:id` | Update a task |
| `DELETE` | `/Task/:id` | Delete a task (soft delete) |
| `GET` | `/Tasks/Count` | Get total task count |

### Lists

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/Lists` | List all lists |
| `GET` | `/List/:id` | Get a single list |
| `POST` | `/List` | Create a new list |
| `PUT` | `/List/:id` | Update a list |
| `DELETE` | `/List/:id` | Delete a list |

### Tags

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/Tags` | List all unique tags |
| `POST` | `/TaskTag` | Add a tag to a task |
| `DELETE` | `/TaskTag/:id` | Remove a tag from a task |

## Pagination

List endpoints support pagination:

```bash
# Get page 2, 25 items per page
curl "http://localhost:8080/api/Tasks?Page=2&PageSize=25"
```

Response includes pagination metadata:

```json
{
  "Records": [...],
  "Page": 2,
  "PageSize": 25,
  "TotalCount": 142
}
```

## Error Responses

Errors return a consistent JSON structure:

```json
{
  "Error": "Task not found",
  "Code": 404
}
```
