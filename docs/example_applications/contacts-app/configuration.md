> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Configuration

Rolodex configuration is passed through the Fable settings object.

## Default Settings

```json
{
  "Product": "Rolodex",
  "LogLevel": 3,
  "Database": {
    "Type": "sqlite",
    "Path": "./contacts.db"
  },
  "Search": {
    "Enabled": true,
    "MinQueryLength": 2,
    "MaxResults": 100
  },
  "Deduplication": {
    "AutoDetect": false,
    "Threshold": 0.85
  },
  "Import": {
    "MaxBatchSize": 500,
    "DuplicateStrategy": "skip"
  }
}
```

## Database Options

Rolodex supports SQLite, MySQL, and MSSQL through Meadow connection modules.

## Search Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `Enabled` | `true` | Enable full-text search indexing |
| `MinQueryLength` | `2` | Minimum characters for a search query |
| `MaxResults` | `100` | Maximum results returned per search |

## Deduplication Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `AutoDetect` | `false` | Automatically flag potential duplicates on create |
| `Threshold` | `0.85` | Similarity score threshold (0.0 to 1.0) |

## Import Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `MaxBatchSize` | `500` | Maximum contacts per bulk import |
| `DuplicateStrategy` | `"skip"` | `"skip"`, `"update"`, or `"create"` |
