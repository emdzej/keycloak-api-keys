package pl.emdzej.keycloak.apikeys.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminApiKeyResponse {
    private String id;
    private String name;
    private String userId;
    private String clientId;
    private String keyPrefix;
    private Instant createdAt;
    private Instant expiresAt;
    private Instant lastUsedAt;
    private Instant revokedAt;
    private long usageCount;
}
