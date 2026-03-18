package pl.emdzej.keycloak.apikeys.rest;

import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.services.resources.admin.AdminEventBuilder;
import org.keycloak.services.resources.admin.ext.AdminRealmResourceProvider;
import org.keycloak.services.resources.admin.fgap.AdminPermissionEvaluator;

public class AdminApiKeyResourceProvider implements AdminRealmResourceProvider {
    private final KeycloakSession session;

    public AdminApiKeyResourceProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public Object getResource(KeycloakSession session, RealmModel realm, AdminPermissionEvaluator auth, AdminEventBuilder adminEvent) {
        return new AdminApiKeyResource(session, realm, auth);
    }

    @Override
    public void close() {
        // no-op
    }
}
