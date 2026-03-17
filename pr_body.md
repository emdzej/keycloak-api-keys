## Summary
Adds the custom OAuth2 grant type for exchanging API keys into JWT access tokens.

## Changes
- Implemented `ApiKeyGrantType` + factory for `urn:ietf:params:oauth:grant-type:api-key`.
- Validates API key status, client match, and user state.
- Builds tokens with restricted roles/scopes and `api_key_id` claim.
- Updates API key usage metadata (last used, IP, usage count).
- Registered grant type SPI and added entity/service helpers.

## Notes
- Roles are limited to the intersection of user roles and API key roles.
- Scope response and token scope are limited to the intersection of client scopes and API key scopes.
