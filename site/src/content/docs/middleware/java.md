---
title: Java / Spring Boot
description: Integrate Keycloak API Keys with Java and Spring Boot applications.
---

# Java / Spring Boot

The Spring Boot starter provides seamless integration with Spring Security.

## Installation

### Maven

```xml
<dependency>
  <groupId>pl.emdzej.keycloak</groupId>
  <artifactId>keycloak-api-keys-spring-boot-starter</artifactId>
  <version>0.1.0</version>
</dependency>
```

### Gradle

```kotlin
implementation("pl.emdzej.keycloak:keycloak-api-keys-spring-boot-starter:0.1.0")
```

## Configuration

```yaml
# application.yml
keycloak:
  api-keys:
    keycloak-url: https://auth.example.com
    realm: my-realm
    client-id: my-api
    client-secret: ${KEYCLOAK_CLIENT_SECRET}
    
    # Optional settings
    header-name: X-API-Key  # default
    cache-ttl: 60s          # cache introspection results
```

## Basic Usage

The starter auto-configures a `SecurityFilterChain` that validates API keys:

```java
@RestController
@RequestMapping("/api")
public class ApiController {
    
    @GetMapping("/data")
    public ResponseEntity<Data> getData(ApiKeyAuthentication auth) {
        // auth.getName() - key ID
        // auth.getApiKeyName() - key name
        // auth.getClientId() - owning client
        // auth.getScopes() - granted scopes
        
        return ResponseEntity.ok(new Data());
    }
}
```

## Custom Security Configuration

If you need to customize the security configuration:

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            ApiKeyAuthenticationFilter apiKeyFilter) throws Exception {
        
        return http
            .addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/**").authenticated()
            )
            .build();
    }
}
```

## Scope-Based Authorization

```java
@RestController
@RequestMapping("/api")
public class ApiController {
    
    @GetMapping("/read")
    @PreAuthorize("hasAuthority('SCOPE_read')")
    public Data read() {
        return dataService.read();
    }
    
    @PostMapping("/write")
    @PreAuthorize("hasAuthority('SCOPE_write')")
    public void write(@RequestBody Data data) {
        dataService.write(data);
    }
}
```

## Mixed Authentication

Support both API keys and JWT tokens:

```java
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            ApiKeyAuthenticationFilter apiKeyFilter) throws Exception {
        
        return http
            .addFilterBefore(apiKeyFilter, BearerTokenAuthenticationFilter.class)
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/**").authenticated()
            )
            .build();
    }
}
```

The filter chain will:
1. Check for `X-API-Key` header → validate via introspection
2. Check for `Authorization: Bearer` header → validate JWT
3. Reject if neither present

## Error Handling

```java
@ControllerAdvice
public class ApiKeyExceptionHandler {
    
    @ExceptionHandler(ApiKeyAuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleApiKeyError(
            ApiKeyAuthenticationException ex) {
        
        return ResponseEntity
            .status(HttpStatus.UNAUTHORIZED)
            .body(new ErrorResponse("Invalid API key"));
    }
}
```

## Testing

```java
@SpringBootTest
@AutoConfigureMockMvc
class ApiControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    void shouldAuthenticateWithApiKey() throws Exception {
        mockMvc.perform(get("/api/data")
                .header("X-API-Key", "test_validkey123"))
            .andExpect(status().isOk());
    }
    
    @Test
    void shouldRejectInvalidKey() throws Exception {
        mockMvc.perform(get("/api/data")
                .header("X-API-Key", "invalid"))
            .andExpect(status().isUnauthorized());
    }
}
```

## Next Steps

- [Node.js Middleware](/keycloak-api-keys/middleware/node/) — Express integration
- [.NET Middleware](/keycloak-api-keys/middleware/dotnet/) — ASP.NET Core integration
