package pl.emdzej.keycloak.apikeys.events;

import org.keycloak.provider.ProviderEvent;

public record ApiKeyRevokedEvent(String realmId,
                                 String userId,
                                 String clientId,
                                 String keyId,
                                 String revokedBy) implements ProviderEvent {
}
