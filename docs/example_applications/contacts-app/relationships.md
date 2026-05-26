> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Relationships

Relationships link two contacts together with a typed, directional association.

## Creating Relationships

```javascript
_Rolodex.createRelationship({
    IDContactFrom: 10,   // Grace Hopper
    IDContactTo: 20,     // US Navy
    RelationType: 'employee-of',
    Title: 'Rear Admiral'
}, (pError, pRelationship) =>
{
    console.log('Linked:', pRelationship.IDRelationship);
});
```

## Relationship Types

Rolodex ships with common relationship types, but you can use any string:

| Type | Inverse | Description |
|------|---------|-------------|
| `employee-of` | `employer-of` | Person works at organization |
| `member-of` | `has-member` | Person belongs to a group |
| `reports-to` | `manages` | Reporting hierarchy |
| `parent-of` | `child-of` | Family relationship |
| `partner-of` | `partner-of` | Symmetric business partnership |
| `knows` | `knows` | General acquaintance |

## Querying Relationships

```javascript
// Get all relationships for a contact
_Rolodex.getRelationships(10, (pError, pRelationships) =>
{
    pRelationships.forEach((pRel) =>
    {
        console.log(pRel.RelationType, '->', pRel.IDContactTo);
    });
});

// Get relationships of a specific type
_Rolodex.getRelationships(10, { Type: 'employee-of' }, (pError, pRelationships) =>
{
    // Just employment relationships
});
```

## Relationship Properties

| Field | Type | Description |
|-------|------|-------------|
| `IDRelationship` | integer | Unique identifier |
| `IDContactFrom` | integer | Source contact |
| `IDContactTo` | integer | Target contact |
| `RelationType` | string | Type of relationship |
| `Title` | string | Role or title within the relationship |
| `StartDate` | datetime | When the relationship began |
| `EndDate` | datetime | When the relationship ended (null = current) |
| `Notes` | text | Additional context |

## Bidirectional Queries

By default, `getRelationships` only returns relationships where the contact is the `From` side. To get all relationships in both directions:

```javascript
_Rolodex.getAllRelationships(10, (pError, pRelationships) =>
{
    // Includes both "from" and "to" relationships
});
```
