package pl.emdzej.keycloak.apikeys.spring;

import java.util.Collection;
import java.util.Map;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

public class ApiKeyAuthenticationToken extends AbstractAuthenticationToken {
    private final Map<String, Object> claims;

    public ApiKeyAuthenticationToken(Map<String, Object> claims, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.claims = claims;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return claims;
    }

    public Map<String, Object> getClaims() {
        return claims;
    }
}
