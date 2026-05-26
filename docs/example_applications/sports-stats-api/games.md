> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Games & Scores

Game data includes schedules, live scores, and final results.

## Game Schema

| Field | Type | Description |
|-------|------|-------------|
| `IDGame` | string | Unique game identifier |
| `League` | string | League code |
| `Season` | integer | Season year |
| `Week` | integer | Week number (NFL) or null |
| `GameDate` | datetime | Scheduled start time (UTC) |
| `Status` | string | `"scheduled"`, `"live"`, `"final"`, `"postponed"` |
| `HomeTeam` | string | Home team code |
| `AwayTeam` | string | Away team code |
| `HomeScore` | integer | Home team score |
| `AwayScore` | integer | Away team score |
| `Period` | string | Current period/quarter/inning |
| `Clock` | string | Game clock (if live) |
| `Venue` | string | Stadium name |

## Querying Games

```bash
# Today's games for a league
curl http://localhost:3000/api/nba/Games/Today

# Games on a specific date
curl http://localhost:3000/api/nba/Games/2026-02-14

# Games for a specific team
curl http://localhost:3000/api/nfl/Team/SEA/Games/2025

# A specific game
curl http://localhost:3000/api/nba/Game/20260214-LAL-BOS

# All games in a week (NFL)
curl http://localhost:3000/api/nfl/Games/2025/Week/17
```

## Score Details

For completed or live games, detailed scoring is available:

```bash
curl http://localhost:3000/api/nba/Game/20260214-LAL-BOS/Scoring
```

Response includes period-by-period breakdown:

```json
{
  "Periods": [
    { "Period": "Q1", "Home": 28, "Away": 31 },
    { "Period": "Q2", "Home": 25, "Away": 22 },
    { "Period": "Q3", "Home": 30, "Away": 27 },
    { "Period": "Q4", "Home": 24, "Away": 29 }
  ],
  "Final": { "Home": 107, "Away": 109 }
}
```

## Box Scores

```bash
curl http://localhost:3000/api/nba/Game/20260214-LAL-BOS/BoxScore
```

Returns player-by-player statistics for both teams in the game.

## Schedule

```bash
# Full season schedule
curl http://localhost:3000/api/nfl/Schedule/2025

# Upcoming games (next 7 days)
curl http://localhost:3000/api/nba/Schedule/Upcoming

# Team schedule for a season
curl http://localhost:3000/api/mlb/Team/NYY/Schedule/2026
```
