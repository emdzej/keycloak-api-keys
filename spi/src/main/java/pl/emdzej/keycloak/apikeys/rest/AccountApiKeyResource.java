package pl.emdzej.keycloak.apikeys.rest;

import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.stream.Collectors;
import org.keycloak.models.KeycloakSession;
import org.keycloak.services.managers.AppAuthManager;
import org.keycloak.services.managers.AuthenticationManager.AuthResult;
import pl.emdzej.keycloak.apikeys.ApiKeyService;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreateRequest;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreatedResponse;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyResponse;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;

@Path("api-keys")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AccountApiKeyResource {
    private final KeycloakSession session;
    private final ApiKeyService apiKeyService;

    public AccountApiKeyResource(KeycloakSession session) {
        this.session = session;
        this.apiKeyService = new ApiKeyService(session);
    }

    @GET
    public List<ApiKeyResponse> list() {
        AuthResult auth = authenticate();
        return apiKeyService.listUserKeys(session.getContext().getRealm(), auth.getUser())
            .stream()
            .map(AccountApiKeyResource::toResponse)
            .collect(Collectors.toList());
    }

    @POST
    public Response create(ApiKeyCreateRequest request) {
        AuthResult auth = authenticate();
        ApiKeyService.CreatedApiKey created = apiKeyService.createUserKey(session.getContext().getRealm(), auth.getUser(), request, auth.getUser());
        ApiKeyCreatedResponse response = toCreatedResponse(created);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @DELETE
    @Path("{keyId}")
    public Response revoke(@PathParam("keyId") String keyId) {
        AuthResult auth = authenticate();
        apiKeyService.revokeUserKey(session.getContext().getRealm(), auth.getUser(), keyId, auth.getUser());
        return Response.noContent().build();
    }

    private AuthResult authenticate() {
        AuthResult auth = new AppAuthManager.BearerTokenAuthenticator(session).authenticate();
        if (auth == null) {
            throw new NotAuthorizedException("Bearer");
        }
        return auth;
    }

    private static ApiKeyResponse toResponse(ApiKeyEntity entity) {
        return new ApiKeyResponse(
            entity.getId(),
            entity.getName(),
            entity.getClientId(),
            entity.getKeyPrefix(),
            entity.getCreatedAt(),
            entity.getExpiresAt(),
            entity.getLastUsedAt(),
            entity.getUsageCount()
        );
    }

    private static ApiKeyCreatedResponse toCreatedResponse(ApiKeyService.CreatedApiKey created) {
        ApiKeyEntity entity = created.entity();
        return new ApiKeyCreatedResponse(
            entity.getId(),
            created.plainKey(),
            entity.getName(),
            entity.getClientId(),
            entity.getKeyPrefix(),
            entity.getCreatedAt(),
            entity.getExpiresAt(),
            entity.getLastUsedAt(),
            entity.getUsageCount()
        );
    }
}
