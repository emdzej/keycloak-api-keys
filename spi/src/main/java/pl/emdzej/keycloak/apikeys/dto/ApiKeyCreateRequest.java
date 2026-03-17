package pl.emdzej.keycloak.apikeys.dto;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyCreateRequest {
    private String name;
    private String clientId;
    private List<String> roles;
    private List<String> scopes;
    private Instant expiresAt;
}
