package pl.emdzej.keycloak.apikeys.jpa;

import java.util.List;
import org.keycloak.connections.jpa.entityprovider.JpaEntityProvider;

public class ApiKeyJpaEntityProvider implements JpaEntityProvider {

    @Override
    public List<Class<?>> getEntities() {
        return List.of(ApiKeyEntity.class);
    }

    @Override
    public String getChangelogLocation() {
        return "META-INF/api-key-changelog.xml";
    }

    @Override
    public String getFactoryId() {
        return ApiKeyJpaEntityProviderFactory.ID;
    }

    @Override
    public void close() {
        // no-op
    }
}
