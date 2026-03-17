package pl.emdzej.keycloak.apikeys.rest;

import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.services.managers.AuthenticationManager;

public class AdminAuth {
    private final AuthenticationManager.AuthResult auth;
    private final RealmModel realm;

    public AdminAuth(KeycloakSession session) {
        this.auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
        if (auth == null) {
            throw new NotAuthorizedException("Bearer");
        }
        this.realm = session.getContext().getRealm();
    }

    public boolean hasViewApiKeys() {
        return hasRole("view-api-keys") || hasRole("manage-api-keys");
    }

    public boolean hasManageApiKeys() {
        return hasRole("manage-api-keys");
    }

    public void requireViewApiKeys() {
        if (!hasViewApiKeys()) {
            throw new ForbiddenException("Requires view-api-keys or manage-api-keys role");
        }
    }

    public void requireManageApiKeys() {
        if (!hasManageApiKeys()) {
            throw new ForbiddenException("Requires manage-api-keys role");
        }
    }

    private boolean hasRole(String roleName) {
        UserModel user = auth.getUser();
        ClientModel realmManagement = realm.getClientByClientId("realm-management");
        if (realmManagement == null) {
            return false;
        }
        RoleModel role = realmManagement.getRole(roleName);
        return role != null && user.hasRole(role);
    }

    public UserModel getUser() {
        return auth.getUser();
    }
}
