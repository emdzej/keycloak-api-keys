package pl.emdzej.keycloak.apikeys.rest;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import pl.emdzej.keycloak.apikeys.ApiKeyService;
import pl.emdzej.keycloak.apikeys.dto.AdminApiKeyResponse;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreateRequest;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyCreatedResponse;
import pl.emdzej.keycloak.apikeys.dto.ApiKeyStatsResponse;
import pl.emdzej.keycloak.apikeys.jpa.ApiKeyEntity;

@Path("")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AdminApiKeyResource {
    private final KeycloakSession session;
    private final ApiKeyService apiKeyService;

    public AdminApiKeyResource(KeycloakSession session) {
        this.session = session;
        this.apiKeyService = new ApiKeyService(session);
    }

    @GET
    public List<AdminApiKeyResponse> list(@QueryParam("userId") String userId,
                                          @QueryParam("clientId") String clientId,
                                          @QueryParam("status") String status) {
        AdminAuth auth = new AdminAuth(session);
        auth.requireViewApiKeys();

        Boolean active = parseStatus(status);
        RealmModel realm = session.getContext().getRealm();

        return apiKeyService.findByRealm(realm, userId, clientId, active)
            .stream()
            .map(AdminApiKeyResource::toAdminResponse)
            .collect(Collectors.toList());
    }

    @GET
    @Path("{keyId}/stats")
    public ApiKeyStatsResponse stats(@PathParam("keyId") String keyId) {
        AdminAuth auth = new AdminAuth(session);
        auth.requireViewApiKeys();

        RealmModel realm = session.getContext().getRealm();
        ApiKeyEntity entity = apiKeyService.getStats(realm, keyId);
        if (entity == null) {
            throw new NotFoundException("API key not found");
        }
        return new ApiKeyStatsResponse(
            entity.getUsageCount(),
            entity.getLastUsedAt(),
            entity.getLastUsedIp(),
            null
        );
    }

    @POST
    @Path("users/{userId}/api-keys")
    public Response createForUser(@PathParam("userId") String userId, ApiKeyCreateRequest request) {
        AdminAuth auth = new AdminAuth(session);
        auth.requireManageApiKeys();

        RealmModel realm = session.getContext().getRealm();
        UserModel user = session.users().getUserById(realm, userId);
        if (user == null) {
            throw new NotFoundException("User not found");
        }

        ApiKeyService.CreatedApiKey created = apiKeyService.createForUser(realm, user, request);
        ApiKeyCreatedResponse response = toCreatedResponse(created);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @DELETE
    @Path("{keyId}")
    public Response revoke(@PathParam("keyId") String keyId) {
        AdminAuth auth = new AdminAuth(session);
        auth.requireManageApiKeys();

        RealmModel realm = session.getContext().getRealm();
        apiKeyService.revokeKey(realm, keyId);
        return Response.noContent().build();
    }

    private static AdminApiKeyResponse toAdminResponse(ApiKeyEntity entity) {
        return new AdminApiKeyResponse(
            entity.getId(),
            entity.getName(),
            entity.getUserId(),
            entity.getClientId(),
            entity.getKeyPrefix(),
            entity.getCreatedAt(),
            entity.getExpiresAt(),
            entity.getLastUsedAt(),
            entity.getRevokedAt(),
            entity.getUsageCount()
        );
    }

    private static Boolean parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String normalized = status.trim().toLowerCase(Locale.ROOT);
        if ("active".equals(normalized)) {
            return true;
        }
        if ("revoked".equals(normalized)) {
            return false;
        }
        throw new BadRequestException("Unsupported status filter: " + status);
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
