## Summary
Adds in-memory rate limiting for API key token exchange (per key/client/realm overrides) with response headers and 429 error handling.

## Changes
- Added rate limit config model/resolver and token-bucket in-memory limiter.
- Integrated limiter into ApiKeyGrantType with 429 response + headers.
- Added per-key rate limit config JSON field on ApiKeyEntity.

## Notes
- Config resolution precedence: per-key override → client attributes → realm attributes → defaults.
- Default limits: 60/min, 1000/hour, 10000/day, burst 10.
