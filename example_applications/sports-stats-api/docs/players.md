> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Players

Player data includes biographical information, career statistics, and per-game breakdowns.

## Player Schema

| Field | Type | Description |
|-------|------|-------------|
| `PlayerSlug` | string | URL-safe identifier (e.g. `"lebron-james"`) |
| `FirstName` | string | First name |
| `LastName` | string | Last name |
| `Position` | string | Playing position |
| `Number` | integer | Jersey number |
| `TeamCode` | string | Current team (null if free agent) |
| `Height` | string | Height (e.g. `"6-9"`) |
| `Weight` | integer | Weight in pounds |
| `BirthDate` | date | Date of birth |
| `College` | string | College attended |
| `DraftYear` | integer | Year drafted |
| `DraftRound` | integer | Round drafted |
| `DraftPick` | integer | Overall pick number |
| `Active` | boolean | Currently active player |

## Querying Players

```bash
# All active players on a team
curl http://localhost:3000/api/nba/Team/LAL/Players

# Single player by slug
curl http://localhost:3000/api/nba/Player/lebron-james

# Search players by name
curl "http://localhost:3000/api/nba/Players/Search?q=james"

# Players at a specific position
curl "http://localhost:3000/api/nfl/Players?Position=QB"
```

## Player Statistics

Statistics are league-specific. Each league defines its own stat categories.

### NBA Stats Example

```bash
# Career averages
curl http://localhost:3000/api/nba/Player/lebron-james/Stats

# Per-season breakdown
curl http://localhost:3000/api/nba/Player/lebron-james/Stats/Seasons

# Single season
curl http://localhost:3000/api/nba/Player/lebron-james/Stats/2025

# Game log for a season
curl http://localhost:3000/api/nba/Player/lebron-james/Games/2025
```

### NFL Stats Example

```bash
# Career passing stats
curl http://localhost:3000/api/nfl/Player/patrick-mahomes/Stats

# Single season
curl http://localhost:3000/api/nfl/Player/patrick-mahomes/Stats/2025
```

## Stat Categories by League

| League | Key Categories |
|--------|---------------|
| NFL | Passing, Rushing, Receiving, Defense, Kicking |
| NBA | Points, Rebounds, Assists, Steals, Blocks, Minutes |
| MLB | Batting (AVG, HR, RBI), Pitching (ERA, W-L, SO) |
| NHL | Goals, Assists, Points, Plus/Minus, PIM |
| MLS | Goals, Assists, Shots, Minutes |
