> **Note:** This is sample documentation for a fictional product, created to demonstrate [pict-docuserve](https://github.com/fable-retold/pict-docuserve). It is not a real application.

# Authentication

Statcaster uses API keys for authentication. All requests must include a valid key.

## Getting an API Key

API keys are provisioned through the developer portal. Each key is associated with an access tier.

## Sending Your Key

Include the API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-key-here" http://localhost:3000/api/nba/Teams
```

## Access Tiers

| Tier | Rate Limit | Historical Data | Live Data | WebSocket |
|------|-----------|-----------------|-----------|-----------|
| Free | 100 req/hour | Current season only | Delayed (5 min) | No |
| Pro | 1,000 req/hour | All seasons | Real-time | Yes (5 connections) |
| Enterprise | 10,000 req/hour | All seasons | Real-time | Unlimited |

## Rate Limit Headers

Every response includes rate limit information:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Requests remaining in current window |
| `X-RateLimit-Reset` | Seconds until the window resets |

## Error Responses

| Status | Description |
|--------|-------------|
| `401` | Missing or invalid API key |
| `403` | Valid key but insufficient tier for this endpoint |
| `429` | Rate limit exceeded |

```json
{
    "Error": "Rate limit exceeded",
    "Code": 429,
    "RetryAfter": 45
}
```
