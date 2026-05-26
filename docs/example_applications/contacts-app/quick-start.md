> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Quick Start

Get Rolodex running and managing contacts in minutes.

## Installation

```bash
npm install rolodex
```

## Basic Usage

```javascript
const libFable = require('fable');
const libRolodex = require('rolodex');

let _Fable = new libFable({
    Product: 'MyApp',
    LogLevel: 3,
    Database: {
        Type: 'sqlite',
        Path: './contacts.db'
    }
});

let _Rolodex = _Fable.instantiateServiceProvider('Rolodex', {});

// Initialize the database schema
_Rolodex.initialize((pError) =>
{
    if (pError) return console.error(pError);

    // Create a person
    _Rolodex.createContact({
        Type: 'Person',
        FirstName: 'Grace',
        LastName: 'Hopper',
        Email: 'grace@navy.mil',
        Phone: '+1-555-0100',
        Notes: 'Pioneer of computer programming'
    }, (pError, pContact) =>
    {
        console.log('Created contact:', pContact.IDContact);
    });
});
```

## Create an Organization

```javascript
_Rolodex.createContact({
    Type: 'Organization',
    OrganizationName: 'US Navy',
    Email: 'info@navy.mil',
    Website: 'https://www.navy.mil'
}, (pError, pOrg) =>
{
    // Link Grace to the Navy
    _Rolodex.createRelationship({
        IDContactFrom: graceId,
        IDContactTo: pOrg.IDContact,
        RelationType: 'employee-of'
    }, (pError, pRel) =>
    {
        console.log('Relationship created');
    });
});
```

## Search Contacts

```javascript
_Rolodex.search('grace', (pError, pResults) =>
{
    console.log('Found', pResults.length, 'contacts');
    pResults.forEach((pContact) =>
    {
        console.log(' -', pContact.FirstName, pContact.LastName);
    });
});
```

## Next Steps

- [Data Model](data-model.md) -- Understand the contact schema
- [Relationships](relationships.md) -- Linking contacts together
- [Custom Fields](custom-fields.md) -- Extending the schema
- [API Reference](api.md) -- Complete API documentation
