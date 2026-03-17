package pl.emdzej.keycloak.apikeys.dto;

import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiKeyStatsResponse {
    private long usageCount;
    private Instant lastUsedAt;
    private String lastUsedIp;
    private List<DailyUsage> usageByDay;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyUsage {
        private String date;
        private long count;
    }
}
