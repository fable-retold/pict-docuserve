> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# API Reference

Statcaster provides a read-only REST API. All endpoints return JSON.

## Base URL

```
http://localhost:3000/api
```

All league-specific endpoints are namespaced: `/api/{league}/...`

## Authentication

API keys are passed via the `X-API-Key` header. See [Authentication](authentication.md) for details.

## Teams

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/{league}/Teams` | List all teams |
| `GET` | `/{league}/Team/{code}` | Get team details |
| `GET` | `/{league}/Team/{code}/Players` | Get team roster |
| `GET` | `/{league}/Team/{code}/Games/{season}` | Get team game log |
| `GET` | `/{league}/Team/{code}/Schedule/{season}` | Get team schedule |
| `GET` | `/Teams?City={city}` | Cross-league team search |

## Players

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/{league}/Players` | List players (paginated) |
| `GET` | `/{league}/Player/{slug}` | Get player details |
| `GET` | `/{league}/Player/{slug}/Stats` | Career statistics |
| `GET` | `/{league}/Player/{slug}/Stats/{season}` | Season statistics |
| `GET` | `/{league}/Player/{slug}/Games/{season}` | Game log |
| `GET` | `/{league}/Players/Search?q={query}` | Search players |

## Games

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/{league}/Games/Today` | Today's games |
| `GET` | `/{league}/Games/{date}` | Games on a date |
| `GET` | `/{league}/Game/{id}` | Single game details |
| `GET` | `/{league}/Game/{id}/Scoring` | Period-by-period scoring |
| `GET` | `/{league}/Game/{id}/BoxScore` | Full box score |
| `GET` | `/{league}/Schedule/{season}` | Season schedule |

## Standings

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/{league}/Standings/{season}` | Full standings |
| `GET` | `/{league}/Standings/{season}/{conference}` | Conference standings |

## Query Parameters

Common parameters supported across endpoints:

| Parameter | Type | Description |
|-----------|------|-------------|
| `Page` | integer | Page number (default: 1) |
| `PageSize` | integer | Results per page (default: 50, max: 200) |
| `Sort` | string | Sort field |
| `Season` | integer | Filter by season year |
| `Conference` | string | Filter by conference |
| `Division` | string | Filter by division |

## Caching

All responses include cache headers:

| Header | Description |
|--------|-------------|
| `X-Cache-Hit` | `true` if response came from cache |
| `X-Cache-Age` | Age of cached data in seconds |
| `Cache-Control` | Browser caching directive |

Live game data has a 15-second cache. Historical data has a 1-hour cache.
