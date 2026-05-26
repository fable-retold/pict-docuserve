> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# WebSocket Feed

Statcaster provides real-time game updates via WebSocket connections, powered by Tidings (the Retold WebSocket module).

## Connecting

```javascript
const ws = new WebSocket('ws://localhost:3000/live');

ws.onopen = () =>
{
    console.log('Connected to Statcaster live feed');

    // Subscribe to NBA games
    ws.send(JSON.stringify({
        Action: 'subscribe',
        League: 'nba',
        Date: '2026-02-14'
    }));
};

ws.onmessage = (pEvent) =>
{
    let tmpUpdate = JSON.parse(pEvent.data);
    console.log(tmpUpdate.Type, tmpUpdate.GameID, tmpUpdate.Data);
};
```

## Message Types

| Type | Description | Frequency |
|------|-------------|-----------|
| `score` | Score change | On each score |
| `clock` | Game clock update | Every 15 seconds |
| `status` | Game status change (start, halftime, final) | On change |
| `play` | Individual play description | On each play |
| `stat` | Player stat line update | After each play |

## Score Update Example

```json
{
    "Type": "score",
    "GameID": "20260214-LAL-BOS",
    "League": "NBA",
    "Timestamp": "2026-02-14T20:15:32Z",
    "Data": {
        "HomeTeam": "BOS",
        "AwayTeam": "LAL",
        "HomeScore": 54,
        "AwayScore": 51,
        "Period": "Q2",
        "Clock": "3:42",
        "ScoringPlay": {
            "Player": "jayson-tatum",
            "Type": "3PT",
            "Points": 3
        }
    }
}
```

## Subscription Management

```javascript
// Subscribe to a specific game
ws.send(JSON.stringify({
    Action: 'subscribe',
    GameID: '20260214-LAL-BOS'
}));

// Subscribe to all games in a league for today
ws.send(JSON.stringify({
    Action: 'subscribe',
    League: 'nba',
    Date: 'today'
}));

// Unsubscribe
ws.send(JSON.stringify({
    Action: 'unsubscribe',
    League: 'nba'
}));

// List active subscriptions
ws.send(JSON.stringify({
    Action: 'list'
}));
```

## Connection Limits

| Tier | Max Connections | Max Subscriptions |
|------|----------------|-------------------|
| Free | 1 | 5 games |
| Pro | 5 | 50 games |
| Enterprise | Unlimited | Unlimited |

## Reconnection

The WebSocket server sends a `ping` every 30 seconds. If you don't receive a ping for 60 seconds, reconnect. Your subscriptions are lost on disconnect and must be re-established.
