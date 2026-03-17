package pl.emdzej.keycloak.apikeys;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;

public final class ApiKeyHasher {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private ApiKeyHasher() {
    }

    public static String hash(String key) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(key.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to hash api key", e);
        }
    }

    public static GeneratedKey generate(String prefix) {
        StringBuilder randomPart = new StringBuilder(64);
        for (int i = 0; i < 64; i++) {
            randomPart.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        String plainKey = prefix + "_" + randomPart;
        return new GeneratedKey(plainKey, hash(plainKey));
    }

    public record GeneratedKey(String plainKey, String hash) {
    }
}
