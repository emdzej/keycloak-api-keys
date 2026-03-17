package pl.emdzej.keycloak.apikeys.events;

import org.keycloak.provider.ProviderEvent;

public record ApiKeyCreatedEvent(String realmId,
                                 String userId,
                                 String clientId,
                                 String keyId,
                                 String createdBy) implements ProviderEvent {
}
