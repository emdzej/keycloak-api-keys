package pl.emdzej.keycloak.apikeys.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyCreatedResponse {
    private String id;
    private String key;
    private String name;
    private String clientId;
    private String keyPrefix;
    private Instant createdAt;
    private Instant expiresAt;
    private Instant lastUsedAt;
    private long usageCount;
}
