> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Configuration

Taskflow is configured through a JSON settings object passed to Fable at initialization.

## Default Configuration

```json
{
  "Product": "Taskflow",
  "LogLevel": 3,
  "Database": {
    "Type": "sqlite",
    "Path": "./taskflow.db"
  },
  "Server": {
    "Port": 8080,
    "Host": "0.0.0.0"
  },
  "Defaults": {
    "PageSize": 50,
    "DefaultList": "Inbox"
  },
  "Auth": {
    "Enabled": false,
    "HeaderName": "X-API-Key",
    "Keys": []
  }
}
```

## Database Options

Taskflow supports three database backends via Meadow:

| Type | Config | Notes |
|------|--------|-------|
| SQLite | `{ "Type": "sqlite", "Path": "./tasks.db" }` | Default; no server needed |
| MySQL | `{ "Type": "mysql", "Host": "localhost", "Database": "taskflow" }` | Production recommended |
| MSSQL | `{ "Type": "mssql", "Host": "localhost", "Database": "taskflow" }` | Enterprise environments |

## Environment Variables

Settings can also be provided via environment variables:

| Variable | Config Path | Example |
|----------|------------|---------|
| `TASKFLOW_PORT` | `Server.Port` | `3000` |
| `TASKFLOW_DB_TYPE` | `Database.Type` | `mysql` |
| `TASKFLOW_DB_HOST` | `Database.Host` | `db.example.com` |
| `TASKFLOW_LOG_LEVEL` | `LogLevel` | `5` |
