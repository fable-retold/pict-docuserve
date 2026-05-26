> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Leagues & Teams

Statcaster organizes data in a hierarchy: League, Conference, Division, Team.

## League Structure

Each league has its own URL namespace:

| League | Base Path | Teams |
|--------|-----------|-------|
| NFL | `/api/nfl/` | 32 |
| NBA | `/api/nba/` | 30 |
| MLB | `/api/mlb/` | 30 |
| NHL | `/api/nhl/` | 32 |
| MLS | `/api/mls/` | 29 |

## Team Schema

| Field | Type | Description |
|-------|------|-------------|
| `TeamCode` | string | Short identifier (e.g. `"SEA"`, `"LAL"`) |
| `Name` | string | Full team name (e.g. `"Seattle Seahawks"`) |
| `City` | string | Home city |
| `Nickname` | string | Team nickname (e.g. `"Seahawks"`) |
| `Conference` | string | Conference name |
| `Division` | string | Division name |
| `Stadium` | string | Home venue name |
| `Founded` | integer | Year the team was established |
| `LogoURL` | string | URL to the team logo |

## Querying Teams

```bash
# All teams in a league
curl http://localhost:3000/api/nfl/Teams

# Single team by code
curl http://localhost:3000/api/nfl/Team/SEA

# Teams in a specific division
curl "http://localhost:3000/api/nfl/Teams?Division=NFC+West"

# Teams in a conference
curl "http://localhost:3000/api/nfl/Teams?Conference=AFC"
```

## Cross-League Queries

To search across all leagues:

```bash
# Find all teams in a city
curl "http://localhost:3000/api/Teams?City=Los+Angeles"

# Response includes teams from NFL, NBA, MLB, NHL, MLS
```
