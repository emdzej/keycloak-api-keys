package pl.emdzej.keycloak.apikeys.events;

import org.keycloak.provider.ProviderEvent;

public record ApiKeyExpiredRejectedEvent(String realmId,
                                         String userId,
                                         String clientId,
                                         String keyId) implements ProviderEvent {
}
