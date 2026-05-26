> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Quick Start

Get Statcaster running and querying sports data in minutes.

## Installation

```bash
npm install statcaster
```

## Start the Server

```javascript
const libFable = require('fable');
const libStatcaster = require('statcaster');

let _Fable = new libFable({
    Product: 'Statcaster',
    LogLevel: 3,
    Database: {
        Type: 'mysql',
        Host: 'localhost',
        Database: 'statcaster',
        User: 'stats',
        Password: 'stats'
    },
    Server: { Port: 3000 }
});

let _API = _Fable.instantiateServiceProvider('Statcaster', {});

_API.start((pError) =>
{
    if (pError) return console.error(pError);
    _Fable.log.info('Statcaster running at http://localhost:3000');
});
```

## Your First Queries

```bash
# Get all NFL teams
curl http://localhost:3000/api/nfl/Teams

# Get a specific team
curl http://localhost:3000/api/nfl/Team/SEA

# Get today's NBA games
curl http://localhost:3000/api/nba/Games/Today

# Get a player's career stats
curl http://localhost:3000/api/nba/Player/lebron-james/Stats

# Get current MLB standings
curl http://localhost:3000/api/mlb/Standings/2026
```

## Response Format

All responses follow a consistent format:

```json
{
  "League": "NFL",
  "Data": [...],
  "Count": 32,
  "Cached": true,
  "CacheAge": 120
}
```

The `Cached` and `CacheAge` fields tell you whether the response came from cache and how old (in seconds) the cached data is.

## Next Steps

- [Authentication](authentication.md) -- API keys and access tiers
- [Leagues & Teams](leagues-teams.md) -- Understanding the data hierarchy
- [API Reference](api.md) -- Complete endpoint documentation
- [WebSocket Feed](websocket.md) -- Real-time score updates
