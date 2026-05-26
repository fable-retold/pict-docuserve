> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Statcaster

Statcaster is a read-oriented sports statistics API built on the Retold stack. It provides a unified interface for querying scores, player statistics, team standings, and schedules across five major North American sports leagues.

## Supported Leagues

| League | Sport | Seasons Available |
|--------|-------|-------------------|
| NFL | Football | 2002 - present |
| NBA | Basketball | 2000 - present |
| MLB | Baseball | 2000 - present |
| NHL | Hockey | 2005 - present |
| MLS | Soccer | 2010 - present |

## Features

- **Unified query language** across all leagues
- **Historical archives** with season, game, and player-level granularity
- **Live game updates** via REST polling or WebSocket subscription
- **Player career stats** with per-game breakdown
- **Team standings** with division and conference views
- **Schedule data** with timezone-aware game times

## Architecture

Statcaster is built for read-heavy workloads:

- **Fable** for configuration and service coordination
- **Meadow** with MySQL for the statistics warehouse
- **Orator** for the REST API and WebSocket server (via Tidings)
- **FoxHound** for complex statistical queries with aggregation

Data is ingested from upstream providers via scheduled jobs and cached aggressively. The API is read-only by design; there are no write endpoints.

## Quick Start

```bash
npm install statcaster
```

See the [Quick Start guide](quick-start.md) to start querying.
