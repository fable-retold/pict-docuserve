> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# API Reference

Rolodex provides a RESTful API when used with Orator. All endpoints follow Meadow conventions.

## Contacts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/Contacts` | List contacts (paginated) |
| `GET` | `/api/Contact/:id` | Get a single contact |
| `POST` | `/api/Contact` | Create a new contact |
| `PUT` | `/api/Contact/:id` | Update a contact |
| `DELETE` | `/api/Contact/:id` | Soft-delete a contact |
| `GET` | `/api/Contacts/Count` | Get total contact count |

## Organizations

Organizations are contacts with `Type: "Organization"`. You can filter:

```bash
curl "http://localhost:8080/api/Contacts?Filter=Type=Organization"
```

## Relationships

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/Relationships/:contactId` | Get relationships for a contact |
| `POST` | `/api/Relationship` | Create a relationship |
| `PUT` | `/api/Relationship/:id` | Update a relationship |
| `DELETE` | `/api/Relationship/:id` | Delete a relationship |

## Search

```bash
# Full-text search
curl "http://localhost:8080/api/Contacts/Search?q=grace"

# Search with filters
curl "http://localhost:8080/api/Contacts/Search?q=grace&Type=Person&City=New+York"
```

Search results include a `Score` field indicating relevance.

## Pagination

All list endpoints support pagination:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `Page` | 1 | Page number |
| `PageSize` | 50 | Records per page |
| `Sort` | `DisplayName` | Sort field |
| `SortDirection` | `asc` | `asc` or `desc` |

## Bulk Operations

```bash
# Import contacts from JSON array
curl -X POST "http://localhost:8080/api/Contacts/Bulk" \
  -H "Content-Type: application/json" \
  -d '[{"Type":"Person","FirstName":"Alan","LastName":"Turing"}, ...]'

# Export all contacts as JSON
curl "http://localhost:8080/api/Contacts/Export"

# Export as vCard
curl "http://localhost:8080/api/Contacts/Export?format=vcard"
```
