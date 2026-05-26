> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Data Model

Rolodex uses a unified contact record for both people and organizations, distinguished by the `Type` field.

## Contact Schema

| Field | Type | Description |
|-------|------|-------------|
| `IDContact` | integer | Unique identifier (auto-generated) |
| `Type` | string | `"Person"` or `"Organization"` |
| `FirstName` | string | First name (people only) |
| `LastName` | string | Last name (people only) |
| `OrganizationName` | string | Organization name (orgs only) |
| `DisplayName` | string | Computed: full name or org name |
| `Email` | string | Primary email address |
| `Phone` | string | Primary phone number |
| `Website` | string | URL |
| `Address` | string | Street address |
| `City` | string | City |
| `State` | string | State or province |
| `PostalCode` | string | ZIP or postal code |
| `Country` | string | Country |
| `Notes` | text | Free-form notes |
| `Avatar` | string | URL to an avatar image |
| `CreateDate` | datetime | When the record was created |
| `UpdateDate` | datetime | When the record was last modified |

## Display Name Logic

The `DisplayName` field is computed automatically:

- **People**: `"{FirstName} {LastName}"`
- **Organizations**: `"{OrganizationName}"`
- If both are empty, falls back to the email address

## Multiple Addresses and Phones

For contacts with multiple email addresses, phone numbers, or physical addresses, use the `ContactDetail` entity:

```javascript
_Rolodex.addDetail({
    IDContact: 42,
    DetailType: 'Email',
    Label: 'Work',
    Value: 'grace@example.com'
});
```

| DetailType | Examples |
|-----------|----------|
| `Email` | Work email, personal email |
| `Phone` | Mobile, office, fax |
| `Address` | Home, office, shipping |
| `Social` | Twitter, LinkedIn, GitHub |

## Soft Deletes

Contacts are never physically deleted. The `Deleted` flag marks a contact as removed, and deleted contacts are excluded from queries by default.

```javascript
// "Delete" a contact
_Rolodex.deleteContact(42, (pError) => { /* done */ });

// Include deleted contacts in a search
_Rolodex.search('grace', { IncludeDeleted: true }, (pError, pResults) => {});
```
