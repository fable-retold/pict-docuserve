> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Rolodex

Rolodex is a contact management library for Node.js. It provides structured storage for people and organizations, with typed relationships between them, custom fields for domain-specific metadata, and full-text search.

## Why Rolodex?

Most applications need contact management eventually -- customer records, team directories, vendor lists. Rolodex provides a clean data model and API so you don't have to build it from scratch every time.

## Features

- **Unified contact model** for people and organizations
- **Typed relationships** (employee-of, reports-to, member-of, etc.)
- **Custom fields** with validation and search indexing
- **Full-text search** across all contact data
- **vCard import/export** for interoperability
- **Deduplication** tools for cleaning up duplicate records
- **Audit trail** on all changes via Meadow

## Built With

Rolodex uses the Retold stack:

- **Fable** for services and configuration
- **Meadow** with Stricture schemas for data access
- **FoxHound** for query generation including full-text search

## Quick Start

```bash
npm install rolodex
```

```javascript
const libFable = require('fable');
const libRolodex = require('rolodex');

let _Fable = new libFable({ Product: 'MyContacts' });
let _Contacts = _Fable.instantiateServiceProvider('Rolodex', {});

_Contacts.create({
    Type: 'Person',
    FirstName: 'Ada',
    LastName: 'Lovelace',
    Email: 'ada@example.com'
}, (pError, pContact) =>
{
    console.log('Created:', pContact.IDContact);
});
```

See the [Quick Start guide](quick-start.md) for more.
