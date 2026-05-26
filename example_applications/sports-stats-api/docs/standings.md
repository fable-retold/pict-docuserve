> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Standings

Standings show team rankings within their league, conference, and division.

## Querying Standings

```bash
# Full league standings for a season
curl http://localhost:3000/api/nfl/Standings/2025

# Conference standings
curl http://localhost:3000/api/nfl/Standings/2025/AFC

# Division standings
curl "http://localhost:3000/api/nfl/Standings/2025?Division=NFC+West"
```

## Standings Schema

Each team's standing record includes:

| Field | Type | Description |
|-------|------|-------------|
| `TeamCode` | string | Team identifier |
| `TeamName` | string | Full team name |
| `Conference` | string | Conference name |
| `Division` | string | Division name |
| `Wins` | integer | Total wins |
| `Losses` | integer | Total losses |
| `Ties` | integer | Ties (NFL) or OT losses (NHL) |
| `WinPct` | float | Winning percentage |
| `GamesBack` | float | Games behind division leader |
| `Streak` | string | Current streak (e.g. `"W3"`, `"L1"`) |
| `Last10` | string | Record over last 10 games |
| `HomeRecord` | string | Home win-loss record |
| `AwayRecord` | string | Away win-loss record |
| `PointsFor` | integer | Total points scored |
| `PointsAgainst` | integer | Total points allowed |
| `Rank` | integer | Overall league rank |

## League-Specific Fields

### NFL

- `DivisionRecord` -- Win-loss within the division
- `ConferenceRecord` -- Win-loss within the conference

### MLB

- `RunDifferential` -- Runs scored minus runs allowed
- `MagicNumber` -- Clinching magic number (during season)

### NBA / NHL

- `OvertimeLosses` -- Losses in overtime (NHL counts toward points)
- `ConferenceRank` -- Rank within conference
