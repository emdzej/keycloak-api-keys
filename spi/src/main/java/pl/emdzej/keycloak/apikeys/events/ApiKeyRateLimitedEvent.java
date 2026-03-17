package pl.emdzej.keycloak.apikeys.events;

import org.keycloak.provider.ProviderEvent;

public record ApiKeyRateLimitedEvent(String realmId,
                                     String userId,
                                     String clientId,
                                     String keyId,
                                     int limit) implements ProviderEvent {
}
