package pl.emdzej.keycloak.apikeys

import java.security.MessageDigest
import java.security.SecureRandom

object ApiKeyHasher {
    private val random = SecureRandom()
    private val alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    fun hash(key: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val bytes = digest.digest(key.toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }
    }

    fun generate(prefix: String): Pair<String, String> {
        val randomPart = buildString(64) {
            repeat(64) {
                append(alphabet[random.nextInt(alphabet.length)])
            }
        }
        val plainKey = "${prefix}_${randomPart}"
        return plainKey to hash(plainKey)
    }
}
