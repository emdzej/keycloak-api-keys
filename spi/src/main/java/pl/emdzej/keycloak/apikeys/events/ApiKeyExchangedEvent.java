package pl.emdzej.keycloak.apikeys.events;

import org.keycloak.provider.ProviderEvent;

public record ApiKeyExchangedEvent(String realmId,
                                   String userId,
                                   String clientId,
                                   String keyId,
                                   String ipAddress) implements ProviderEvent {
}
